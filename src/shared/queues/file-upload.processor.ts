import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { CloudinaryService } from '@modules/cloudinary/cloudinary.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { UserRepository } from '@repositories/user.repository';
import { Job } from 'bullmq';
import { SocketEmitterService } from '../../modules/socket/socket-emitter.service';

@Processor(FILE_UPLOAD_QUEUE)
export class FileUploadProcessor extends WorkerHost {
  private readonly logger = new Logger(FileUploadProcessor.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly userRepository: UserRepository,
    private readonly socketEmitterService: SocketEmitterService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case FILE_UPLOAD_JOB.UPLOAD_USER_AVATAR:
        return this.handleUploadUserAvatar(job);
      case FILE_UPLOAD_JOB.UPLOAD_USER_BACKGROUND:
        return this.handleUploadUserBackground(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
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

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User ${userId} not found for avatar upload`);
        return;
      }

      await this.userRepository.update(userId, { avatarUrl });

      this.socketEmitterService.emitUserProfileUpdate(user.email, {
        userId,
        avatarUrl,
      });

      this.logger.log(`Avatar of user ${userId} updated`);
    } catch (error) {
      this.logger.error(
        `Failed to upload avatar for user ${userId}`,
        (error as Error).stack,
      );

      const user = await this.userRepository.findOne({ where: { id: userId } });
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

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User ${userId} not found for background upload`);
        return;
      }

      await this.userRepository.update(userId, { backgroundUrl });

      this.socketEmitterService.emitUserProfileUpdate(user.email, {
        userId,
        backgroundUrl,
      });

      this.logger.log(`Background of user ${userId} updated`);
    } catch (error) {
      this.logger.error(
        `Failed to upload background for user ${userId}`,
        (error as Error).stack,
      );

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        this.socketEmitterService.emitUserProfileUpdate(user.email, {
          userId,
          backgroundUrl: null,
          status: 'FAILED',
        });
      }
    }
  }
}
