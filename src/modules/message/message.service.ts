import {
  NOTIFICATION_MESSAGES,
  NotificationType,
} from '@constants/notification.constant';
import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import {
  ConversationStatus,
  ConversationType,
  MessageAttachmentStatus,
  MessageAttachmentType,
  MessageStatus,
  MessageType,
  ParticipantStatus,
  RoleUser,
} from '@constants/user.constant';
import { ConversationEntity } from '@entities/conversation.entity';
import { MessageAttachmentEntity } from '@entities/message-attachment.entity';
import { MessageEntity } from '@entities/message.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageAttachmentRepository } from '@repositories/message-attachment.repository';
import { MessagePinRepository } from '@repositories/message-pin.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
  httpForbidden,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { Transactional } from 'typeorm-transactional';
import { ConversationResDto } from '../conversation/dto/conversation.res.dto';
import { NotificationService } from '../notification/notification.service';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import {
  EditMessageDto,
  MarkAsReadDto,
  MessageAttachmentFilterDto,
  MessageFilterDto,
  PinMessageDto,
  SendMessageDto,
  UnpinMessageDto,
} from './dtos/message.req.dto';
import {
  MessageAttachmentResDto,
  MessagePinResDto,
  MessageResDto,
} from './dtos/message.res.dto';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly participantRepo: ParticipantRepository,
    private readonly socketEmitterService: SocketEmitterService,
    private readonly messageAttachmentRepo: MessageAttachmentRepository,
    private readonly messagePinRepo: MessagePinRepository,
    @InjectQueue(FILE_UPLOAD_QUEUE) private readonly fileUploadQueue: Queue,
    private readonly notificationService: NotificationService,
  ) {}

  // ==================== VALIDATION ====================
  /**
   * Validate conversation
   */
  private async validateConversation(
    conversationId: number,
    type?: ConversationType,
  ): Promise<ConversationEntity> {
    let conversation: ConversationEntity | null;
    if (type) {
      conversation = await this.conversationRepo.findOne({
        where: { id: conversationId, type },
      });
    } else {
      conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      throw new httpNotFound(
        httpErrors.CONVERSATION_NOT_FOUND.message,
        httpErrors.CONVERSATION_NOT_FOUND.code,
      );
    }

    if (
      [ConversationStatus.BLOCKED, ConversationStatus.DELETED].includes(
        conversation.status,
      )
    ) {
      throw new httpBadRequest(
        httpErrors.INVALID_CONVERSATION.message,
        httpErrors.INVALID_CONVERSATION.code,
      );
    }
    return conversation;
  }

  /**
   * Validate message
   */
  private async validateMessage(messageId: number): Promise<MessageEntity> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
    });
    if (!message) {
      throw new httpNotFound(
        httpErrors.MESSAGE_NOT_FOUND.message,
        httpErrors.MESSAGE_NOT_FOUND.code,
      );
    }
    return message;
  }

  /**
   * Validate user is a participant of the conversation
   */
  private async validateParticipant(
    conversationId: number,
    userId: number,
    relations?: any,
  ) {
    const participant = await this.participantRepo.findOne({
      where: { conversationId, userId },
      relations,
    });
    if (!participant) {
      throw new httpBadRequest(
        httpErrors.NOT_PARTICIPANT_OF_CONVERSATION.message,
        httpErrors.NOT_PARTICIPANT_OF_CONVERSATION.code,
      );
    }

    if (participant.status === ParticipantStatus.BLOCKED) {
      throw new httpForbidden(
        httpErrors.BLOCKED_USER.message,
        httpErrors.BLOCKED_USER.code,
      );
    }

    if (participant.status === ParticipantStatus.DELETED) {
      throw new httpForbidden(
        httpErrors.ACCOUNT_DELETED.message,
        httpErrors.ACCOUNT_DELETED.code,
      );
    }

    // Only ACTIVE or ARCHIVED participants can perform actions
    if (
      ![ParticipantStatus.ACTIVE, ParticipantStatus.ARCHIVED].includes(
        participant.status,
      )
    ) {
      throw new httpForbidden(
        httpErrors.FORBIDDEN.message,
        httpErrors.FORBIDDEN.code,
      );
    }

    return participant;
  }

  /**
   * Validate participant is sender of the message
   */
  private validateSenderParticipant(
    message: MessageEntity,
    participantId: number,
  ) {
    if (message.senderParticipantId !== participantId) {
      throw new httpBadRequest(
        httpErrors.NOT_SENDER_OF_MESSAGE.message,
        httpErrors.NOT_SENDER_OF_MESSAGE.code,
      );
    }
  }

  /**
   * Validate message is not pinned
   */
  private async validateMessageIsNotPinned(message: MessageEntity) {
    const isPinned = await this.messagePinRepo.findOne({
      where: { messageId: message.id },
    });
    if (isPinned) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_IS_PINNED.message,
        httpErrors.MESSAGE_IS_PINNED.code,
      );
    }
  }

  /**
   * Map message to response DTO
   */
  private mapMessageToResponse(message: MessageEntity): MessageResDto {
    return plainToInstance(
      MessageResDto,
      {
        ...message,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Map conversation to response DTO
   */
  private mapConversationToResponse(
    conversation: ConversationEntity,
  ): ConversationResDto {
    return plainToInstance(ConversationResDto, conversation, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Emit global conversation update to all participants
   */
  private async emitGlobalUpdate(
    conversationId: number,
    lastMessage?: MessageEntity,
  ) {
    try {
      const participants = await this.participantRepo.find({
        where: { conversationId },
        relations: { user: true },
      });

      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
      });

      if (!conversation) return;

      const conversationRes = this.mapConversationToResponse(conversation);

      for (const participant of participants) {
        if (participant.user?.email) {
          this.socketEmitterService.emitGlobalConversationUpdate(
            participant.user.email,
            {
              conversation: conversationRes,
              unreadCount: participant.unreadCount,
              lastMessage: lastMessage
                ? this.mapMessageToResponse(lastMessage)
                : undefined,
            },
          );
        }
      }
    } catch (error) {
      console.error('Failed to emit global conversation update', error);
    }
  }

  /**
   * Generate message preview text
   */
  private generateMessagePreview(
    content?: string,
    attachments?: MessageAttachmentEntity[],
  ): string {
    let preview = content ? content.trim() : '';
    if (!preview && attachments && attachments.length > 0) {
      if (attachments.length === 1) {
        const attachment = attachments[0];
        const typeLabels: Record<MessageAttachmentType, string> = {
          [MessageAttachmentType.IMAGE]: '[Image]',
          [MessageAttachmentType.VIDEO]: '[Video]',
          [MessageAttachmentType.AUDIO]: '[Audio]',
          [MessageAttachmentType.FILE]: '[File]',
        };
        preview = typeLabels[attachment.type] || '[Attachment]';
      } else {
        preview = `[${attachments.length} attachments]`;
      }
    }

    if (preview.length > 100) {
      preview = preview.substring(0, 97) + '...';
    }
    return preview;
  }

  // ==================== GET MESSAGE INFO ====================
  async getMessageInfo(messageId: number) {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: {
        replyToMessage: true,
        attachments: true,
        pins: {
          pinnedByParticipant: {
            user: true,
          },
        },
      },
    });
    if (!message) {
      throw new httpNotFound(
        httpErrors.MESSAGE_NOT_FOUND.message,
        httpErrors.MESSAGE_NOT_FOUND.code,
      );
    }
    return this.mapMessageToResponse(message);
  }

  // ================== GET MESSAGE LIST ===================
  async getConversationMessages(
    conversationId: number,
    filterDto: MessageFilterDto,
    payload?: JwtPayloadDto,
  ): Promise<PageDto<MessageResDto>> {
    // Check role
    if (payload?.role !== RoleUser.ADMIN) {
      // Validate participant
      await this.validateParticipant(conversationId, payload!.id);
    }

    const { entities, total } =
      await this.messageRepo.getConversationMessagesWithFilters(
        conversationId,
        filterDto,
      );

    const mappedItems = entities.map((message) => {
      return this.mapMessageToResponse(message);
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ============= GET MESSAGE ATTACHMENT LIST =============
  async getConversationAttachments(
    conversationId: number,
    filterDto: MessageAttachmentFilterDto,
  ): Promise<PageDto<MessageAttachmentResDto>> {
    const { entities, total } =
      await this.messageAttachmentRepo.getConversationAttachmentsWithFilters(
        conversationId,
        filterDto,
      );

    const mappedItems = entities.map((attachment) => {
      return plainToInstance(
        MessageAttachmentResDto,
        {
          ...attachment,
        },
        { excludeExtraneousValues: true },
      );
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== GET PINNED MESSAGES =====================
  async getPinnedMessages(
    conversationId: number,
    filterDto: MessageFilterDto,
  ): Promise<PageDto<MessagePinResDto>> {
    const { entities, total } =
      await this.messagePinRepo.getPinnedMessagesWithFilters(
        conversationId,
        filterDto,
      );

    const mappedItems = entities.map((pin) => {
      return plainToInstance(
        MessagePinResDto,
        {
          ...pin,
        },
        { excludeExtraneousValues: true },
      );
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  // ==================== SEND MESSAGE =====================
  @Transactional()
  async sendMessage(
    userId: number,
    dto: SendMessageDto,
    files?: Express.Multer.File[],
  ) {
    // Validate conversation
    const conversation = await this.validateConversation(dto.conversationId);

    // Validate participant (sender)
    const senderParticipant = await this.validateParticipant(
      dto.conversationId,
      userId,
    );

    // Handle Reply Logic
    let parentMessage: MessageEntity | null = null;
    if (dto.replyToMessageId) {
      parentMessage = await this.validateMessage(dto.replyToMessageId);
      if (parentMessage.conversationId !== dto.conversationId) {
        throw new httpBadRequest(
          httpErrors.MESSAGE_NOT_IN_CONVERSATION.message,
          httpErrors.MESSAGE_NOT_IN_CONVERSATION.code,
        );
      }
    }

    // Validate message content OR attachments
    const hasFiles = files && files.length > 0;
    if (!hasFiles && (!dto.content || dto.content.trim().length === 0)) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_CONTENT_REQUIRED.message,
        httpErrors.MESSAGE_CONTENT_REQUIRED.code,
      );
    }

    if (dto.content && dto.content.length > 4000) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_CONTENT_TOO_LONG.message,
        httpErrors.MESSAGE_CONTENT_TOO_LONG.code,
      );
    }

    // Determine message type
    const messageType = hasFiles ? MessageType.ATTACHMENT : MessageType.TEXT;

    // Create message
    const message = await this.messageRepo.createEntity({
      sequence: Number(conversation.lastMessageSeq || 0) + 1,
      conversationId: dto.conversationId,
      senderParticipantId: senderParticipant.id,
      content: dto.content || '',
      type: messageType,
      status: MessageStatus.SENT,
      replyToMessageId: dto.replyToMessageId,
    });
    message.attachments = [];
    message.pins = [];
    message.replyToMessage = parentMessage as MessageEntity;

    if (hasFiles) {
      const maxSize = 5 * 1024 * 1024;
      for (const file of files) {
        if (file.size > maxSize) {
          throw new httpBadRequest(
            httpErrors.FILE_TOO_LARGE(file.originalname).message,
            httpErrors.FILE_TOO_LARGE(file.originalname).code,
          );
        }
      }

      // Create message_attachments with PENDING status
      const messageAttachmentsData = files.map((file) => {
        return {
          messageId: message.id,
          type: MessageAttachmentType.FILE,
          status: MessageAttachmentStatus.PENDING,
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      });

      const messageAttachments =
        await this.messageAttachmentRepo.createEntities(
          messageAttachmentsData as any,
        );
      message.attachments = messageAttachments;

      // Add jobs to queue for background upload
      for (let i = 0; i < files.length; i++) {
        await this.fileUploadQueue.add(FILE_UPLOAD_JOB.UPLOAD_ATTACHMENT, {
          messageId: message.id,
          attachmentId: messageAttachments[i].id,
          file: {
            buffer: files[i].buffer,
            originalname: files[i].originalname,
            mimetype: files[i].mimetype,
            size: files[i].size,
          },
          conversationId: dto.conversationId,
        });
      }
    }

    // Determine preview text
    const preview = this.generateMessagePreview(
      message.content,
      message.attachments,
    );

    // Update conversation
    await this.conversationRepo.updateEntityById(dto.conversationId, {
      lastMessageId: message.id,
      lastMessageSeq: message.sequence,
      lastMessagePreview: preview,
      lastMessageType: message.type,
      lastMessageSenderId: senderParticipant.id,
      lastMessageAt: new Date(),
    });

    // Increment unread count for other participants
    await this.participantRepo.incrementUnreadCount(
      dto.conversationId,
      senderParticipant.userId,
    );

    // Emit message to conversation room
    this.socketEmitterService.emitNewMessage(dto.conversationId, message);

    // Emit global conversation update to all participants
    void this.emitGlobalUpdate(dto.conversationId, message);

    // Create notifications for other participants
    try {
      const participants = await this.participantRepo.find({
        where: { conversationId: dto.conversationId },
        relations: { user: true },
      });

      // Fetch sender user info since validateParticipant didn't load it
      const senderInfo = await this.participantRepo.findOne({
        where: { id: senderParticipant.id },
        relations: { user: true },
      });

      const senderName = senderInfo?.user?.username || 'Someone';

      for (const participant of participants) {
        if (
          participant.userId !== senderParticipant.userId &&
          participant.user
        ) {
          await this.notificationService.createNotification({
            userId: participant.userId,
            title: NOTIFICATION_MESSAGES[NotificationType.NEW_MESSAGE].title,
            message:
              NOTIFICATION_MESSAGES[NotificationType.NEW_MESSAGE].message(
                senderName,
              ),
            type: NotificationType.NEW_MESSAGE,
            metadata: {
              conversationId: dto.conversationId,
              messageId: message.id,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to create notifications for new message:', error);
    }

    return message;
  }

  // ==================== EDIT MESSAGE ====================
  @Transactional()
  async editMessage(
    userId: number,
    dto: EditMessageDto,
    files?: Express.Multer.File[],
  ) {
    // Validate user is active
    const participant = await this.validateParticipant(
      dto.conversationId,
      userId,
    );

    // Validate message with attachments relation
    const message = await this.messageRepo.findOne({
      where: { id: dto.messageId },
      relations: { attachments: true },
    });

    if (!message) {
      throw new httpNotFound(
        httpErrors.MESSAGE_NOT_FOUND.message,
        httpErrors.MESSAGE_NOT_FOUND.code,
      );
    }

    // Validate participant is sender of this message
    await this.validateSenderParticipant(message, participant.id);

    // Validate message is not pinned
    await this.validateMessageIsNotPinned(message);

    // Validate message is not edited more than 5 times
    if (message.editCount >= 5) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_EDIT_LIMIT_EXCEEDED.message,
        httpErrors.MESSAGE_EDIT_LIMIT_EXCEEDED.code,
      );
    }

    // Validate message is not sent more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_EDIT_TIME_LIMIT_EXCEEDED.message,
        httpErrors.MESSAGE_EDIT_TIME_LIMIT_EXCEEDED.code,
      );
    }

    // Validate message content OR attachments
    const hasFiles = files && files.length > 0;
    if (
      !hasFiles &&
      message.attachments.length === 0 &&
      (!dto.content || dto.content.trim().length === 0)
    ) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_CONTENT_REQUIRED.message,
        httpErrors.MESSAGE_CONTENT_REQUIRED.code,
      );
    }

    if (dto.content && dto.content.length > 4000) {
      throw new httpBadRequest(
        httpErrors.MESSAGE_CONTENT_TOO_LONG.message,
        httpErrors.MESSAGE_CONTENT_TOO_LONG.code,
      );
    }

    // Handle attachments update if new files provided
    if (hasFiles) {
      // Delete old attachments from DB
      if (message.attachments.length > 0) {
        await this.messageAttachmentRepo.deleteEntitiesByCondition({
          messageId: message.id,
        });
      }

      const maxSize = 5 * 1024 * 1024;
      for (const file of files) {
        if (file.size > maxSize) {
          throw new httpBadRequest(
            httpErrors.FILE_TOO_LARGE(file.originalname).message,
            httpErrors.FILE_TOO_LARGE(file.originalname).code,
          );
        }
      }

      // Create message_attachments with PENDING status
      const newAttachmentsData = files.map((file) => {
        return {
          messageId: message.id,
          type: MessageAttachmentType.FILE,
          status: MessageAttachmentStatus.PENDING,
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      });

      const newAttachments = await this.messageAttachmentRepo.createEntities(
        newAttachmentsData as any,
      );
      message.attachments = newAttachments;
      message.type = MessageType.ATTACHMENT;

      // Add jobs to queue for background upload
      for (let i = 0; i < files.length; i++) {
        await this.fileUploadQueue.add(FILE_UPLOAD_JOB.UPLOAD_ATTACHMENT, {
          messageId: message.id,
          attachmentId: newAttachments[i].id,
          file: {
            buffer: files[i].buffer,
            originalname: files[i].originalname,
            mimetype: files[i].mimetype,
            size: files[i].size,
          },
          conversationId: message.conversationId,
        });
      }
    } else if (message.attachments.length === 0) {
      // If no new files and no existing files, check if it's now a TEXT message
      message.type = MessageType.TEXT;
    }

    // Update message fields
    message.content = dto.content ?? message.content;
    message.editCount += 1;
    message.isEdited = true;
    message.editedAt = new Date();
    await this.messageRepo.updateEntity(message, {});

    // Determine preview text for conversation update
    const preview = this.generateMessagePreview(
      message.content,
      message.attachments,
    );

    // Update conversation if this was the last message
    const conversation = await this.conversationRepo.findOne({
      where: { id: message.conversationId },
    });

    if (conversation && conversation.lastMessageId === message.id) {
      await this.conversationRepo.updateEntityById(message.conversationId, {
        lastMessagePreview: preview,
        lastMessageType: message.type,
      });
    }

    // Get full message info for emission
    const updatedMessage = await this.messageRepo.findOne({
      where: { id: message.id },
      relations: {
        attachments: true,
        replyToMessage: true,
      },
    });

    // Increment unread count for other participants on edit as requested
    await this.participantRepo.incrementUnreadCount(
      message.conversationId,
      participant.userId,
    );

    // Emit message to conversation room
    this.socketEmitterService.emitEditMessage(
      message.conversationId,
      updatedMessage || undefined,
    );

    // Emit global conversation update to all participants
    void this.emitGlobalUpdate(
      message.conversationId,
      updatedMessage || undefined,
    );

    return this.mapMessageToResponse(updatedMessage as MessageEntity);
  }

  // ==================== MARK AS READ ====================
  async markAsRead(userId: number, dto: MarkAsReadDto) {
    // Validate conversation
    const conversation = await this.validateConversation(dto.conversationId);

    // Validate participant is participant of this conversation
    const participant = await this.validateParticipant(
      conversation.id,
      userId,
      ['user'],
    );

    // Mark all messages in conversation as read
    await this.participantRepo.update(
      {
        conversationId: dto.conversationId,
        userId: participant.userId,
      },
      {
        lastReadSeq: conversation.lastMessageSeq,
        unreadCount: 0,
      },
    );

    // Emit message to conversation room
    this.socketEmitterService.emitMarkMessageAsRead(participant.user.email, {
      conversationId: dto.conversationId,
      participantId: participant.id,
    });

    // Emit global conversation update to all participants
    void this.emitGlobalUpdate(dto.conversationId);

    return true;
  }

  // ==================== PIN MESSAGE =====================
  async pinMessage(userId: number, dto: PinMessageDto) {
    // Validate message
    const message = await this.validateMessage(dto.messageId);

    // Validate participant is participant of this conversation
    const participant = await this.validateParticipant(
      message.conversationId,
      userId,
    );

    // Validate message is not pinned
    await this.validateMessageIsNotPinned(message);

    // Create message pin
    const messagePin = await this.messagePinRepo.createEntity({
      conversationId: message.conversationId,
      messageId: message.id,
      pinnedAt: new Date(),
      pinnedByParticipantId: participant.id,
    });

    // Emit message to conversation room
    this.socketEmitterService.emitPinMessage(
      message.conversationId,
      messagePin,
    );
    return true;
  }

  // ==================== UNPIN MESSAGE ===================
  async unpinMessage(userId: number, dto: UnpinMessageDto) {
    // Validate message
    const message = await this.validateMessage(dto.messageId);

    // Validate participant is participant of this conversation
    const participant = await this.validateParticipant(
      message.conversationId,
      userId,
    );

    // Validate participant is pinned by
    const messagePin = await this.messagePinRepo.findOne({
      where: {
        messageId: message.id,
      },
    });
    if (!messagePin) {
      throw new httpNotFound(
        httpErrors.MESSAGE_PIN_NOT_FOUND.message,
        httpErrors.MESSAGE_PIN_NOT_FOUND.code,
      );
    }
    if (messagePin.pinnedByParticipantId !== participant.id) {
      throw new httpBadRequest(
        httpErrors.CANNOT_UNPIN_OTHERS_MESSAGE.message,
        httpErrors.CANNOT_UNPIN_OTHERS_MESSAGE.code,
      );
    }

    // Delete message PIN
    await this.messagePinRepo.deleteEntitiesByCondition({
      messageId: message.id,
    });

    // Emit message to conversation room
    this.socketEmitterService.emitUnpinMessage(message.conversationId, {
      messageId: message.id,
    });
    return true;
  }
}
