import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { UPDATE_PROFILE_RES } from '@constants/user.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@repositories/user.repository';
import {
  httpBadRequest,
  httpErrors,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { Transactional } from 'typeorm-transactional';
import { UpdateProfileDto } from './dto/user.req.dto';
import { UserResDto } from './dto/user.res.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectQueue(FILE_UPLOAD_QUEUE) private readonly fileUploadQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  // ==================== GET PROFILE ====================
  async getProfile(userId: number): Promise<UserResDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }
    return plainToInstance(UserResDto, user, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE PROFILE ====================
  @Transactional()
  async updateProfile(
    userId: number,
    payload: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
    backgroundFile?: Express.Multer.File,
  ) {
    // Check user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    // Update profile
    if (payload.username && payload.username !== user!.username) {
      const existing = await this.userRepository.existsBy({
        username: payload.username,
      });
      if (existing) {
        throw new httpBadRequest(
          httpErrors.USERNAME_EXISTED.message,
          httpErrors.USERNAME_EXISTED.code,
        );
      }
      user!.username = payload.username;
    }

    if (payload.description) {
      user!.description = payload.description;
    }

    if (avatarFile) {
      const maxAvatarSize = Number(
        this.configService.get<number>('MAX_AVATAR_SIZE', 5242880),
      );
      if (avatarFile.size > maxAvatarSize) {
        throw new httpBadRequest(
          httpErrors.FILE_TOO_LARGE(avatarFile.originalname).message,
          httpErrors.FILE_TOO_LARGE(avatarFile.originalname).code,
        );
      }

      await this.fileUploadQueue.add(FILE_UPLOAD_JOB.UPLOAD_USER_AVATAR, {
        userId,
        file: {
          buffer: avatarFile.buffer,
          originalname: avatarFile.originalname,
          mimetype: avatarFile.mimetype,
          size: avatarFile.size,
        },
      });
    }

    if (backgroundFile) {
      const maxBackgroundSize = Number(
        this.configService.get<number>('MAX_BACKGROUND_SIZE', 10485760),
      );
      if (backgroundFile.size > maxBackgroundSize) {
        throw new httpBadRequest(
          httpErrors.FILE_TOO_LARGE(backgroundFile.originalname).message,
          httpErrors.FILE_TOO_LARGE(backgroundFile.originalname).code,
        );
      }

      await this.fileUploadQueue.add(FILE_UPLOAD_JOB.UPLOAD_USER_BACKGROUND, {
        userId,
        file: {
          buffer: backgroundFile.buffer,
          originalname: backgroundFile.originalname,
          mimetype: backgroundFile.mimetype,
          size: backgroundFile.size,
        },
      });
    }

    await this.userRepository.save(user!);

    // Return message
    return {
      message: UPDATE_PROFILE_RES,
    };
  }
}
