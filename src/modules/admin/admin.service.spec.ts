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
  let userRepository: jest.Mocked<UserRepository>;
  let accountHistoryRepository: jest.Mocked<AccountHistoryRepository>;
  let participantRepository: jest.Mocked<ParticipantRepository>;
  let messageRepository: jest.Mocked<MessageRepository>;
  let socketEmitterService: jest.Mocked<SocketEmitterService>;
  let systemMessageQueue: any;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      getUserListByFilter: jest.fn(),
      create: jest.fn(),
    };

    const mockAccountHistoryRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      getAccountHistoryListByFilter: jest.fn(),
    };

    const mockParticipantRepository = {
      update: jest.fn(),
    };

    const mockMessageRepository = {
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
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: AccountHistoryRepository,
          useValue: mockAccountHistoryRepository,
        },
        { provide: ParticipantRepository, useValue: mockParticipantRepository },
        { provide: MessageRepository, useValue: mockMessageRepository },
        { provide: SocketEmitterService, useValue: mockSocketEmitterService },
        {
          provide: getQueueToken(SYSTEM_MESSAGE_QUEUE),
          useValue: mockSystemMessageQueue,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get(UserRepository);
    accountHistoryRepository = module.get(AccountHistoryRepository);
    participantRepository = module.get(ParticipantRepository);
    messageRepository = module.get(MessageRepository);
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
        userRepository.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any) // admin
          .mockResolvedValueOnce({ ...mockUser } as any); // user

        accountHistoryRepository.create.mockReturnValue({} as any);

        await service.blockUser(1, 2, { reason: 'spam' });

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: UserStatus.BLOCKED }),
        );
        expect(participantRepository.update).toHaveBeenCalledWith(
          { userId: 2 },
          { status: ParticipantStatus.BLOCKED },
        );
        expect(socketEmitterService.emitUserBlocked).toHaveBeenCalled();
      });

      it('should throw error if user already blocked', async () => {
        userRepository.findOne
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
        userRepository.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({
            ...mockUser,
            status: UserStatus.BLOCKED,
          } as any);

        accountHistoryRepository.create.mockReturnValue({} as any);

        await service.unblockUser(1, 2, { reason: 'apology' });

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: UserStatus.ACTIVE }),
        );
        expect(participantRepository.update).toHaveBeenCalledWith(
          { userId: 2 },
          { status: ParticipantStatus.ACTIVE },
        );
        expect(socketEmitterService.emitUserUnblocked).toHaveBeenCalled();
      });

      it('should throw error if user not blocked', async () => {
        userRepository.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({ ...mockUser } as any);

        await expect(
          service.unblockUser(1, 2, { reason: 'apology' }),
        ).rejects.toThrow(httpBadRequest);
      });
    });

    describe('deleteUser', () => {
      it('should delete user successfully', async () => {
        userRepository.findOne
          .mockResolvedValueOnce({ ...mockAdmin } as any)
          .mockResolvedValueOnce({ ...mockUser } as any);

        accountHistoryRepository.create.mockReturnValue({} as any);

        await service.deleteUser(1, 2, { reason: 'spam' });

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: UserStatus.DELETED }),
        );
        expect(participantRepository.update).toHaveBeenCalledWith(
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
        userRepository.findOne.mockResolvedValue({ id: 1 } as any);
        await expect(
          service.createAdmin({
            email: 'test@test.com',
            username: 'test',
            password: 'pw',
          }),
        ).rejects.toThrow(httpBadRequest);
      });

      it('should create new admin', async () => {
        userRepository.findOne.mockResolvedValue(null);
        userRepository.create.mockReturnValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);
        userRepository.save.mockResolvedValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);

        const result = await service.createAdmin({
          email: 'new@test.com',
          username: 'new',
          password: 'pw',
        });

        expect(userRepository.save).toHaveBeenCalled();
        expect(result.id).toBe(1);
      });
    });

    describe('updateAdmin', () => {
      it('should update admin details', async () => {
        const mockAdmin = {
          id: 1,
          role: RoleUser.ADMIN,
          username: 'old',
          email: 'old@test.com',
        };
        userRepository.findOne
          .mockResolvedValueOnce(mockAdmin as any)
          .mockResolvedValueOnce(null);
        userRepository.save.mockResolvedValue(mockAdmin as any);

        await service.updateAdmin(1, { username: 'new' });

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'new' }),
        );
      });
    });
  });

  describe('Dashboard & Notifications', () => {
    describe('getAdminDashboardStats', () => {
      it('should return stats', async () => {
        userRepository.findOne.mockResolvedValue({
          id: 1,
          role: RoleUser.ADMIN,
        } as any);
        userRepository.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
        messageRepository.count.mockResolvedValue(100);

        const result = await service.getAdminDashboardStats(1);
        expect(result.totalStudents).toBe(10);
        expect(result.totalTeachers).toBe(5);
        expect(result.totalMessages).toBe(100);
      });
    });

    describe('sendSystemNotification', () => {
      it('should queue system message', async () => {
        userRepository.findOne.mockResolvedValue({
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
