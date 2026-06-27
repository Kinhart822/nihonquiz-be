import {
  SYSTEM_MESSAGE_JOB,
  SYSTEM_MESSAGE_QUEUE,
} from '@constants/queue.constant';
import {
  ConversationStatus,
  ConversationType,
  MessageStatus,
  MessageType,
  ParticipantRole,
  ParticipantStatus,
  RoleUser,
  UserStatus,
} from '@constants/user.constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import { Job } from 'bullmq';
import { SocketEmitterService } from '../../modules/socket/socket-emitter.service';
import { In } from 'typeorm';

@Processor(SYSTEM_MESSAGE_QUEUE)
export class SystemMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemMessageProcessor.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly participantRepo: ParticipantRepository,
    private readonly messageRepo: MessageRepository,
    private readonly socketEmitterService: SocketEmitterService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case SYSTEM_MESSAGE_JOB.SEND_BROADCAST:
        return this.handleSendBroadcast(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendBroadcast(job: Job<any>) {
    const { adminId, content } = job.data;
    this.logger.log(`Starting system broadcast from admin ${adminId}`);

    // Get all active users
    const users = await this.userRepo.find({
      where: {
        role: In([RoleUser.STUDENT, RoleUser.TEACHER]),
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true },
    });

    if (users.length === 0) return;

    // Process in chunks
    const chunkSize = 100;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      const userIds = chunk.map((u) => u.id);

      try {
        // 1. Find existing direct conversations between Admin and Users
        const existingConversations = await this.conversationRepo
          .createQueryBuilder('c')
          .innerJoin('c.participants', 'p_admin', 'p_admin.userId = :adminId', {
            adminId,
          })
          .innerJoinAndSelect(
            'c.participants',
            'p_user',
            'p_user.userId IN (:...userIds)',
            { userIds },
          )
          .where('c.type = :type', { type: ConversationType.DIRECT })
          .getMany();

        const existingUserIds = new Set(
          existingConversations
            .map((c) => c.participants[0]?.userId)
            .filter(Boolean),
        );

        const missingUserIds = userIds.filter((id) => !existingUserIds.has(id));
        let allConversations = [...existingConversations];

        // 2. Bulk create missing conversations
        if (missingUserIds.length > 0) {
          const newConvs = missingUserIds.map(() =>
            this.conversationRepo.create({
              type: ConversationType.DIRECT,
              ownerId: adminId,
              status: ConversationStatus.ACTIVE,
            }),
          );
          const savedConvs = await this.conversationRepo.save(newConvs);

          // 3. Bulk create participants for new conversations
          const newParticipants: any[] = [];
          savedConvs.forEach((conv, index) => {
            const userId = missingUserIds[index];
            newParticipants.push(
              this.participantRepo.create({
                conversationId: conv.id,
                userId: adminId,
                role: ParticipantRole.OWNER,
                status: ParticipantStatus.ACTIVE,
                joinedAt: new Date(),
              }),
              this.participantRepo.create({
                conversationId: conv.id,
                userId: userId,
                role: ParticipantRole.MEMBER,
                status: ParticipantStatus.ACTIVE,
                joinedAt: new Date(),
              }),
            );
          });
          await this.participantRepo.save(newParticipants);

          allConversations = [...allConversations, ...savedConvs];
        }

        const allConvIds = allConversations.map((c) => c.id);

        // 4. Get Admin Participant IDs for all conversations
        const adminParticipants = await this.participantRepo.find({
          where: {
            conversationId: In(allConvIds),
            userId: adminId,
          },
          select: { id: true, conversationId: true },
        });
        const adminParticipantMap = new Map(
          adminParticipants.map((p) => [p.conversationId, p.id]),
        );

        // 5. Bulk create messages
        const newMessages = allConversations.map((conv) => {
          return this.messageRepo.create({
            conversationId: conv.id,
            senderParticipantId: adminParticipantMap.get(conv.id),
            content: content,
            type: MessageType.SYSTEM,
            status: MessageStatus.SENT,
            sequence: Number(conv.lastMessageSeq || 0) + 1,
          });
        });
        const savedMessages = await this.messageRepo.save(newMessages);

        // 6. Bulk update conversations (last message summary)
        const updatedConvs = savedMessages.map((msg) => ({
          id: msg.conversationId,
          lastMessageSeq: msg.sequence,
          lastMessagePreview: msg.content,
          lastMessageType: msg.type,
          lastMessageSenderId: msg.senderParticipantId,
          lastMessageAt: msg.createdAt,
        }));
        await this.conversationRepo.save(updatedConvs);

        // 7. Bulk increment unread counts
        await this.participantRepo
          .createQueryBuilder()
          .update()
          .set({ unreadCount: () => 'unread_count + 1' })
          .where('conversationId IN (:...allConvIds)', { allConvIds })
          .andWhere('userId != :adminId', { adminId })
          .execute();

        // 8. Emit sockets
        savedMessages.forEach((msg) => {
          this.socketEmitterService.emitNewMessage(msg.conversationId, msg);
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to process chunk for broadcast from admin ${adminId}`,
          err.stack,
        );
      }
    }

    this.logger.log(`Broadcast from admin ${adminId} completed`);
  }
}
