import {
  SYSTEM_MESSAGE_JOB,
  SYSTEM_MESSAGE_QUEUE,
} from '@constants/queue.constant';
import {
  AccountHistoryType,
  ParticipantStatus,
  RoleUser,
  UserStatus,
} from '@constants/user.constant';
import { UserResDto } from '@modules/user/dtos/user.res.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AccountHistoryRepository } from '@repositories/account-history.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { In } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import {
  AccountHistoryFilterDto,
  ActionDto,
  AdminFilterDto,
  CreateAdminDto,
  EditAdminDto,
  SystemNotificationDto,
} from './dtos/admin.req.dto';
import { AccountHistoryResDto } from './dtos/admin.res.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly accountHistoryRepo: AccountHistoryRepository,
    private readonly participantRepo: ParticipantRepository,
    private readonly messageRepo: MessageRepository,
    private readonly socketEmitterService: SocketEmitterService,
    @InjectQueue(SYSTEM_MESSAGE_QUEUE)
    private readonly systemMessageQueue: Queue,
  ) {}

  // ==================== USER MANAGEMENT ====================

  /**
   * Block a user
   */
  @Transactional()
  async blockUser(adminId: number, userId: number, dto: ActionDto) {
    await this.validateAdmin(adminId);
    const user = await this.validateUserExists(userId);

    if (user.status === UserStatus.BLOCKED) {
      throw new httpBadRequest(
        httpErrors.USER_ALREADY_BLOCKED.message,
        httpErrors.USER_ALREADY_BLOCKED.code,
      );
    }

    user.status = UserStatus.BLOCKED;

    await this.participantRepo.update(
      { userId: user.id },
      { status: ParticipantStatus.BLOCKED },
    );

    await this.userRepo.save(user);
    await this.createAccountHistory({
      userId,
      type: AccountHistoryType.BLOCKED,
      actionBy: adminId,
      reason: dto.reason,
      status: UserStatus.BLOCKED,
    });

    // Emit socket event to the affected user
    const emitData = {
      userId,
      status: UserStatus.BLOCKED,
      reason: dto.reason,
      actionBy: adminId,
      timestamp: new Date(),
    };
    this.socketEmitterService.emitUserBlocked(user.email, emitData);

    return true;
  }

  /**
   * Unblock a user
   */
  @Transactional()
  async unblockUser(adminId: number, userId: number, dto: ActionDto) {
    await this.validateAdmin(adminId);
    const user = await this.validateUserExists(userId);

    if (user.status !== UserStatus.BLOCKED) {
      throw new httpBadRequest(
        httpErrors.USER_NOT_BLOCKED.message,
        httpErrors.USER_NOT_BLOCKED.code,
      );
    }

    user.status = UserStatus.ACTIVE;

    await this.participantRepo.update(
      { userId: user.id },
      { status: ParticipantStatus.ACTIVE },
    );

    await this.userRepo.save(user);
    await this.createAccountHistory({
      userId,
      type: AccountHistoryType.UNBLOCKED,
      actionBy: adminId,
      reason: dto.reason,
      status: UserStatus.ACTIVE,
    });

    // Emit socket event to the affected user
    const emitData = {
      userId,
      status: UserStatus.ACTIVE,
      reason: dto.reason,
      actionBy: adminId,
      timestamp: new Date(),
    };
    this.socketEmitterService.emitUserUnblocked(user.email, emitData);

    return true;
  }

  /**
   * Delete a user
   */
  @Transactional()
  async deleteUser(adminId: number, userId: number, dto: ActionDto) {
    await this.validateAdmin(adminId);
    const user = await this.validateUserExists(userId);

    if (user.status === UserStatus.DELETED) {
      throw new httpBadRequest(
        httpErrors.USER_ALREADY_DELETED.message,
        httpErrors.USER_ALREADY_DELETED.code,
      );
    }

    user.status = UserStatus.DELETED;

    await this.participantRepo.update(
      { userId: user.id },
      { status: ParticipantStatus.DELETED },
    );

    await this.userRepo.save(user);
    await this.createAccountHistory({
      userId,
      type: AccountHistoryType.DELETED,
      actionBy: adminId,
      reason: dto.reason,
      status: UserStatus.DELETED,
    });

    // Emit socket event to the affected user
    const emitData = {
      userId,
      status: UserStatus.DELETED,
      reason: dto.reason,
      actionBy: adminId,
      timestamp: new Date(),
    };
    this.socketEmitterService.emitUserDeleted(user.email, emitData);

    return true;
  }

  // ==================== ADMIN MANAGEMENT ====================

  /**
   * Get list of admin accounts
   */
  async getAdminList(filterDto: AdminFilterDto): Promise<PageDto<UserResDto>> {
    const { entities, total } = await this.userRepo.getUserListByFilter(
      filterDto,
      { isAdmin: true, isTeacher: false, isStudent: false },
    );

    const mappedItems = entities.map((user) => {
      return plainToInstance(UserResDto, user, {
        excludeExtraneousValues: true,
      });
    });

    const meta = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, meta);
  }

  /**
   * Get info admin account
   */
  async getAdminInfo(id: number): Promise<UserResDto> {
    const user = await this.userRepo.findOne({
      where: { id, role: RoleUser.ADMIN },
    });
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

  /**
   * Create new admin account
   */
  @Transactional()
  async createAdmin(dto: CreateAdminDto) {
    const { email, username, password, description } = dto;

    // Check account existed
    const existed = await this.userRepo.findOne({
      where: [{ email }, { username }],
    });
    if (existed) {
      throw new httpBadRequest(
        httpErrors.ACCOUNT_EXISTED.message,
        httpErrors.ACCOUNT_EXISTED.code,
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password!, 12);

    // Create admin
    const admin = this.userRepo.create({
      email,
      username,
      password: hashedPassword,
      role: RoleUser.ADMIN,
      status: UserStatus.INACTIVE,
      description,
    });

    const saved = await this.userRepo.save(admin);
    return plainToInstance(UserResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update admin account
   */
  @Transactional()
  async updateAdmin(id: number, dto: EditAdminDto) {
    const { email, username, password, description } = dto;

    // Check admin existed
    const admin = await this.userRepo.findOne({
      where: { id, role: RoleUser.ADMIN },
    });
    if (!admin) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    if (password) {
      admin.password = await bcrypt.hash(password, 12);
    }

    if (username) {
      const existed = await this.userRepo.findOne({
        where: { username },
      });
      if (existed) {
        throw new httpBadRequest(
          httpErrors.ACCOUNT_EXISTED.message,
          httpErrors.ACCOUNT_EXISTED.code,
        );
      }
      admin.username = username;
    }

    if (email) {
      const existed = await this.userRepo.findOne({
        where: { email },
      });
      if (existed) {
        throw new httpBadRequest(
          httpErrors.ACCOUNT_EXISTED.message,
          httpErrors.ACCOUNT_EXISTED.code,
        );
      }
      admin.email = email;
    }

    if (description) {
      admin.description = description;
    }

    const saved = await this.userRepo.save(admin);
    return plainToInstance(UserResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Delete admin account
   */
  @Transactional()
  async deleteAdmin(adminId: number) {
    const admin = await this.userRepo.findOne({
      where: { id: adminId, role: RoleUser.ADMIN },
    });
    if (!admin) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    await this.userRepo.delete({ id: adminId });
    return true;
  }

  // ==================== ACCOUNT HISTORY ====================

  /**
   * Record a new account history event
   */
  @Transactional()
  async createAccountHistory(data: {
    userId: number;
    type: AccountHistoryType;
    reason?: string;
    status?: string;
    actionBy?: number;
  }) {
    const history = this.accountHistoryRepo.create(data);
    return await this.accountHistoryRepo.save(history);
  }

  /**
   * Get list of account history
   */
  async getAccountHistoryList(
    filterDto: AccountHistoryFilterDto,
  ): Promise<PageDto<AccountHistoryResDto>> {
    const { entities, total } =
      await this.accountHistoryRepo.getAccountHistoryListByFilter(filterDto);

    const mappedItems = entities.map((history) => {
      return plainToInstance(AccountHistoryResDto, history, {
        excludeExtraneousValues: true,
      });
    });

    const pageMetaDto = new PageMetaDto(filterDto, total);
    return new PageDto(mappedItems, pageMetaDto);
  }

  /**
   * Get info account history
   */
  async getAccountHistoryInfo(id: number) {
    const history = await this.accountHistoryRepo.findOne({
      where: { id },
    });
    if (!history) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_HISTORY_NOT_FOUND.message,
        httpErrors.ACCOUNT_HISTORY_NOT_FOUND.code,
      );
    }
    return plainToInstance(AccountHistoryResDto, history, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Send system notification (message) to all users (Background Job)
   */
  async sendSystemNotification(adminId: number, dto: SystemNotificationDto) {
    await this.validateAdmin(adminId);

    // Add job to queue
    await this.systemMessageQueue.add(SYSTEM_MESSAGE_JOB.SEND_BROADCAST, {
      adminId,
      content: dto.content,
    });

    return true;
  }

  // ==================== VALIDATION ====================

  /**
   * Validate that an admin exists
   */
  private async validateAdmin(adminId: number) {
    const admin = await this.userRepo.findOne({
      where: { id: adminId, role: RoleUser.ADMIN },
    });
    if (!admin) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }
    return admin;
  }

  /**
   * Validate that a user exists
   */
  private async validateUserExists(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, role: In([RoleUser.STUDENT, RoleUser.TEACHER]) },
    });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }
    return user;
  }
}
