import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import {
  MessageAttachmentStatus,
  MessageStatus,
} from '@constants/user.constant';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageAttachmentRepository } from '@repositories/message-attachment.repository';
import { MessageRepository } from '@repositories/message.repository';
import { UserRepository } from '@repositories/user.repository';
import { Job } from 'bullmq';
import { SocketEmitterService } from '../../modules/socket/socket-emitter.service';

@Processor(FILE_UPLOAD_QUEUE)
export class FileUploadProcessor extends WorkerHost {
  private readonly logger = new Logger(FileUploadProcessor.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly messageAttachmentRepo: MessageAttachmentRepository,
    private readonly messageRepo: MessageRepository,
    private readonly conversationRepo: ConversationRepository,
    private readonly userRepo: UserRepository,
    private readonly socketEmitterService: SocketEmitterService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case FILE_UPLOAD_JOB.UPLOAD_ATTACHMENT:
        return this.handleUploadAttachment(job);
      case FILE_UPLOAD_JOB.UPLOAD_CONVERSATION_AVATAR:
        return this.handleUploadConversationAvatar(job);
      case FILE_UPLOAD_JOB.UPLOAD_USER_AVATAR:
        return this.handleUploadUserAvatar(job);
      case FILE_UPLOAD_JOB.UPLOAD_USER_BACKGROUND:
        return this.handleUploadUserBackground(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // ==================== HANDLE UPLOAD CONVERSATION AVATAR ====================
  private async handleUploadConversationAvatar(job: Job<any>) {
    const { conversationId, file } = job.data;
    const buffer = Buffer.from(file.buffer.data);
    const multerFile: Express.Multer.File = {
      ...file,
      buffer,
    } as any;

    try {
      const res = await this.cloudinaryService.uploadFile(multerFile);
      const avatarUrl = (res as any).secure_url;

      await this.conversationRepo.update(conversationId, {
        avatarUrl,
      });

      this.socketEmitterService.emitUpdateConversationAvatar(conversationId, {
        conversationId,
        avatarUrl,
      });

      this.logger.log(`Avatar of conversation ${conversationId} updated`);
    } catch (error: any) {
      this.logger.error(
        `Failed to upload avatar for conversation ${conversationId}`,
        error.stack,
      );

      // Emit failure status
      this.socketEmitterService.emitUpdateConversationAvatar(conversationId, {
        conversationId,
        avatarUrl: null,
        status: 'FAILED',
      });
    }
  }

  // ==================== HANDLE UPLOAD USER AVATAR ====================
  private async handleUploadUserAvatar(job: Job<any>) {
    const { userId, file } = job.data;
    const buffer = Buffer.from(file.buffer.data);
    const multerFile: Express.Multer.File = {
      ...file,
      buffer,
    } as any;

    try {
      const res = await this.cloudinaryService.uploadFile(multerFile);
      const avatarUrl = (res as any).secure_url;

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User ${userId} not found for avatar upload`);
        return;
      }

      await this.userRepo.update(userId, { avatarUrl });

      this.socketEmitterService.emitUserProfileUpdate(user.email, {
        userId,
        avatarUrl,
      });

      this.logger.log(`Avatar of user ${userId} updated`);
    } catch (error: any) {
      this.logger.error(
        `Failed to upload avatar for user ${userId}`,
        error.stack,
      );

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        this.socketEmitterService.emitUserProfileUpdate(user.email, {
          userId,
          avatarUrl: null,
          status: 'FAILED',
        });
      }
    }
  }

  // ==================== HANDLE UPLOAD USER BACKGROUND ====================
  private async handleUploadUserBackground(job: Job<any>) {
    const { userId, file } = job.data;
    const buffer = Buffer.from(file.buffer.data);
    const multerFile: Express.Multer.File = {
      ...file,
      buffer,
    } as any;

    try {
      const res = await this.cloudinaryService.uploadFile(multerFile);
      const backgroundUrl = (res as any).secure_url;

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User ${userId} not found for background upload`);
        return;
      }

      await this.userRepo.update(userId, { backgroundUrl });

      this.socketEmitterService.emitUserProfileUpdate(user.email, {
        userId,
        backgroundUrl,
      });

      this.logger.log(`Background of user ${userId} updated`);
    } catch (error: any) {
      this.logger.error(
        `Failed to upload background for user ${userId}`,
        error.stack,
      );

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user) {
        this.socketEmitterService.emitUserProfileUpdate(user.email, {
          userId,
          backgroundUrl: null,
          status: 'FAILED',
        });
      }
    }
  }

  // ==================== HANDLE UPLOAD ATTACHMENT ====================
  private async handleUploadAttachment(job: Job<any>) {
    const { messageId, attachmentId, file, conversationId } = job.data;

    const buffer = Buffer.from(file.buffer.data);
    const multerFile: Express.Multer.File = {
      ...file,
      buffer,
    } as any;

    try {
      const res = await this.cloudinaryService.uploadFile(multerFile);
      const mediaType = this.cloudinaryService.getMediaTypeFromResult(res);

      const updateData = {
        type: mediaType,
        status: MessageAttachmentStatus.SUCCESS,
        url: (res as any).secure_url,
        size: (res as any).bytes,
        duration: (res as any).duration
          ? Math.round((res as any).duration)
          : undefined,
        mimeType: (res as any).resource_type + '/' + (res as any).format,
      };

      await this.messageAttachmentRepo.update(attachmentId, updateData);

      // Verify message status
      await this.messageRepo.update(messageId, {
        status: MessageStatus.SENT,
      });

      // Notify clients via Socket
      this.socketEmitterService.emitUpdateAttachment(conversationId, {
        messageId,
        attachment: {
          id: attachmentId,
          ...updateData,
        },
      });

      this.logger.log(`Attachment ${attachmentId} uploaded successfully`);
    } catch (error: any) {
      this.logger.error(
        `Failed to upload attachment ${attachmentId}`,
        error.stack,
      );

      await this.messageAttachmentRepo.update(attachmentId, {
        status: MessageAttachmentStatus.FAILED,
      });

      // Emit failure status
      this.socketEmitterService.emitUpdateAttachment(conversationId, {
        messageId,
        attachment: {
          id: attachmentId,
          status: MessageAttachmentStatus.FAILED,
        },
      });
    }
  }
}
