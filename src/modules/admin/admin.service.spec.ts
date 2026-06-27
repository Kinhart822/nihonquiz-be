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
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountHistoryRepository } from '@repositories/account-history.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import {
  httpBadRequest,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import * as bcrypt from 'bcrypt';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import { AdminService } from './admin.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('AdminService', () => {
  let service: AdminService;
  let userRepo: jest.Mocked<UserRepository>;
  let accountHistoryRepo: jest.Mocked<AccountHistoryRepository>;
  let participantRepo: jest.Mocked<ParticipantRepository>;
  let messageRepo: jest.Mocked<MessageRepository>;
  let socketEmitterService: jest.Mocked<SocketEmitterService>;
  let systemMessageQueue: any;

  beforeEach(async () => {
    const mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      getUserListByFilter: jest.fn(),
      create: jest.fn(),
    };

    const mockAccountHistoryRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      getAccountHistoryListByFilter: jest.fn(),
    };

    const mockParticipantRepo = {
      update: jest.fn(),
    };

    const mockMessageRepo = {
      count: jest.fn(),
    };

    const mockSocketEmitterService = {
      emitUserBlocked: jest.fn(),
      emitUserUnblocked: jest.fn(),
      emitUserDeleted: jest.fn(),
    };

    const mockSystemMessageQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: UserRepository, useValue: mockUserRepo },
        {
          provide: AccountHistoryRepository,
          useValue: mockAccountHistoryRepo,
        },
        { provide: ParticipantRepository, useValue: mockParticipantRepo },
        { provide: MessageRepository, useValue: mockMessageRepo },
        { provide: SocketEmitterService, useValue: mockSocketEmitterService },
        {
          provide: getQueueToken(SYSTEM_MESSAGE_QUEUE),
          useValue: mockSystemMessageQueue,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(UserRepository);
    accountHistoryRepo = module.get(AccountHistoryRepository);
    participantRepo = module.get(ParticipantRepository);
    messageRepo = module.get(MessageRepository);
    socketEmitterService = module.get(SocketEmitterService);
    systemMessageQueue = module.get(getQueueToken(SYSTEM_MESSAGE_QUEUE));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('User Management', () => {
    const mockAdmin = { id: 1, role: RoleUser.ADMIN };
    const mockUser = {
      id: 2,
      role: RoleUser.STUDENT,
      status: UserStatus.ACTIVE,
      email: 'test@test.com',
    };

    describe('blockUser', () => {
      it('should block user successfully', async () => {
        /*
         * Flow: Block User
         * 1. Query DB to ensure requester is Admin and target user exists.
         * 2. Log action to AccountHistory.
         * 3. Update user status to BLOCKED in User table.
         * 4. Update participant status to BLOCKED in Participant table.
         * 5. Emit 'user.blocked' event via socket.
         */
        userRepo.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any) // admin
          .mockResolvedValueOnce({ ...mockUser } as any); // user

        accountHistoryRepo.create.mockReturnValue({} as any);

        await service.blockUser(1, 2, { reason: 'spam' });

        expect(userRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: UserStatus.BLOCKED }),
        );
        expect(participantRepo.update).toHaveBeenCalledWith(
          { userId: 2 },
          { status: ParticipantStatus.BLOCKED },
        );
        expect(socketEmitterService.emitUserBlocked).toHaveBeenCalled();
      });

      it('should throw error if user already blocked', async () => {
        /*
         * Flow: Block User Error Handling
         * 1. Query DB for user and admin.
         * 2. If target user status is already BLOCKED, throw BadRequest exception.
         */
        userRepo.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({
            ...mockUser,
            status: UserStatus.BLOCKED,
          } as any);

        await expect(
          service.blockUser(1, 2, { reason: 'spam' }),
        ).rejects.toThrow(httpBadRequest);
      });
    });

    describe('unblockUser', () => {
      it('should unblock user successfully', async () => {
        /*
         * Flow: Unblock User
         * 1. Check if user is currently BLOCKED.
         * 2. Create history log for unblock action.
         * 3. Update User and Participant status to ACTIVE.
         * 4. Emit 'user.unblocked' socket event.
         */
        userRepo.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({
            ...mockUser,
            status: UserStatus.BLOCKED,
          } as any);

        accountHistoryRepo.create.mockReturnValue({} as any);

        await service.unblockUser(1, 2, { reason: 'apology' });

        expect(userRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: UserStatus.ACTIVE }),
        );
        expect(participantRepo.update).toHaveBeenCalledWith(
          { userId: 2 },
          { status: ParticipantStatus.ACTIVE },
        );
        expect(socketEmitterService.emitUserUnblocked).toHaveBeenCalled();
      });

      it('should throw error if user not blocked', async () => {
        /*
         * Flow: Unblock User Error Handling
         * 1. Fetch user status.
         * 2. If user is NOT blocked, throw BadRequest exception.
         */
        userRepo.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({ ...mockUser } as any);

        await expect(
          service.unblockUser(1, 2, { reason: 'apology' }),
        ).rejects.toThrow(httpBadRequest);
      });
    });

    describe('deleteUser', () => {
      it('should delete user successfully', async () => {
        /*
         * Flow: Delete User (Soft Delete)
         * 1. Verify admin permissions.
         * 2. Log deletion to AccountHistory.
         * 3. Set user status to DELETED (soft delete approach).
         * 4. Update all participant records for this user to DELETED.
         * 5. Emit 'user.deleted' socket event to kick user out.
         */
        userRepo.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({ ...mockUser } as any);

        accountHistoryRepo.create.mockReturnValue({} as any);

        await service.deleteUser(1, 2, { reason: 'spam' });

        expect(userRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: UserStatus.DELETED }),
        );
        expect(participantRepo.update).toHaveBeenCalledWith(
          { userId: 2 },
          { status: ParticipantStatus.DELETED },
        );
        expect(socketEmitterService.emitUserDeleted).toHaveBeenCalled();
      });
    });
  });

  describe('Admin Management', () => {
    describe('createAdmin', () => {
      it('should throw error if admin exists', async () => {
        /*
         * Flow: Create Admin Error
         * 1. Look up user by email or username.
         * 2. If an account already exists, throw BadRequest exception.
         */
        userRepo.findOne.mockResolvedValue({ id: 1 } as any);
        await expect(
          service.createAdmin({
            email: 'test@test.com',
            username: 'test',
            password: 'pw',
          }),
        ).rejects.toThrow(httpBadRequest);
      });

      it('should create new admin', async () => {
        /*
         * Flow: Create Admin
         * 1. Ensure no existing user has the same credentials.
         * 2. Hash password and create User entity with role ADMIN.
         * 3. Save to database.
         */
        userRepo.findOne.mockResolvedValue(null);
        userRepo.create.mockReturnValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);
        userRepo.save.mockResolvedValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);

        const result = await service.createAdmin({
          email: 'new@test.com',
          username: 'new',
          password: 'pw',
        });

        expect(userRepo.save).toHaveBeenCalled();
        expect(result.id).toBe(1);
      });
    });

    describe('updateAdmin', () => {
      it('should update admin details', async () => {
        /*
         * Flow: Update Admin
         * 1. Retrieve admin user to update.
         * 2. Verify new username/email doesn't belong to another user.
         * 3. Save updated fields to database.
         */
        const mockAdmin = {
          id: 1,
          role: RoleUser.ADMIN,
          username: 'old',
          email: 'old@test.com',
        };
        userRepo.findOne
          .mockResolvedValueOnce(mockAdmin as any)
          .mockResolvedValueOnce(null);
        userRepo.save.mockResolvedValue(mockAdmin as any);

        await service.updateAdmin(1, { username: 'new' });

        expect(userRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'new' }),
        );
      });
    });
  });

  describe('Dashboard & Notifications', () => {
    describe('getAdminDashboardStats', () => {
      it('should return stats', async () => {
        /*
         * Flow: Dashboard Stats
         * 1. Ensure requester is admin.
         * 2. Count total students.
         * 3. Count total teachers.
         * 4. Count total messages across system.
         * 5. Return aggregated stats object.
         */
        userRepo.findOne.mockResolvedValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);
        userRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
        messageRepo.count.mockResolvedValue(100);

        const result = await service.getAdminDashboardStats(1);
        expect(result.totalStudents).toBe(10);
        expect(result.totalTeachers).toBe(5);
        expect(result.totalMessages).toBe(100);
      });
    });

    describe('sendSystemNotification', () => {
      it('should queue system message', async () => {
        /*
         * Flow: Send System Broadcast Notification
         * 1. Verify admin permissions.
         * 2. Add broadcast job to BullMQ SystemMessageQueue.
         * 3. Background worker will process and deliver to all users.
         */
        userRepo.findOne.mockResolvedValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);

        await service.sendSystemNotification(1, { content: 'test msg' });

        expect(systemMessageQueue.add).toHaveBeenCalledWith(
          SYSTEM_MESSAGE_JOB.SEND_BROADCAST,
          {
            adminId: 1,
            content: 'test msg',
          },
        );
      });
    });
  });
});
