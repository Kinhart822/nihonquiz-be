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
import * as bcrypt from 'bcrypt';
import { Transactional } from 'typeorm-transactional';
import { ChangePasswordDto, UpdateProfileDto } from './dtos/user.req.dto';
import { UserResDto } from './dtos/user.res.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    @InjectQueue(FILE_UPLOAD_QUEUE) private readonly fileUploadQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  // ==================== GET PROFILE ====================
  async getProfile(userId: number): Promise<UserResDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
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
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    // Update profile
    if (payload.username && payload.username !== user!.username) {
      const existing = await this.userRepo.existsBy({
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

    await this.userRepo.save(user!);

    // Return message
    return {
      message: UPDATE_PROFILE_RES,
    };
  }

  // ==================== CHANGE PASSWORD ====================
  @Transactional()
  async changePassword(userId: number, payload: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    if (!user.password) {
      throw new httpBadRequest(
        httpErrors.CHANGE_PASSWORD_FAILED.message,
        httpErrors.CHANGE_PASSWORD_FAILED.code,
      );
    }

    const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
    if (!isMatch) {
      throw new httpBadRequest(
        httpErrors.INVALID_OLD_PASSWORD.message,
        httpErrors.INVALID_OLD_PASSWORD.code,
      );
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 12);
    user.password = hashedPassword;
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }
}
