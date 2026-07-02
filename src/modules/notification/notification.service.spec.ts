import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from '../../database/repository/notification.repository';
import { UserRepository } from '../../database/repository/user.repository';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import { NotificationType } from '../../constants/notification.constant';
import { UserEntity } from '../../database/entities/user.entity';
import { HttpException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: jest.Mocked<NotificationRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let socketEmitterService: jest.Mocked<SocketEmitterService>;

  beforeEach(async () => {
    const mockNotificationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      paginate: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockSocketEmitterService = {
      emitNewNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: mockNotificationRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: SocketEmitterService,
          useValue: mockSocketEmitterService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get(NotificationRepository) as any;
    userRepository = module.get(UserRepository) as any;
    socketEmitterService = module.get(SocketEmitterService) as any;
  });

  it('should be defined', () => {
    /*
     * Flow: should be defined
     * 1. Setup mock data and dependencies.
     * 2. Execute the method under test.
     * 3. Verify the expected results and behavior.
     */
    expect(service).toBeDefined();
  });

  /* Flow: Create Notification
     1. User is found
     2. Save notification to DB
     3. Emit socket event
     4. Return Dto
  */
  describe('createNotification', () => {
    it('should create and emit notification', async () => {
      /*
       * Flow: should create and emit notification
       * 1. Setup mock data and dependencies.
       * 2. Execute the method under test.
       * 3. Verify the expected results and behavior.
       */
      const mockUser = { id: 1, email: 'test@example.com' } as UserEntity;
      userRepository.findOne.mockResolvedValue(mockUser);

      const mockNotification = {
        id: 1,
        userId: 1,
        title: 'Title',
        message: 'Message',
        type: NotificationType.SYSTEM_ALERT,
        isRead: false,
        createdAt: new Date(),
      };
      notificationRepository.create.mockReturnValue(mockNotification as any);
      notificationRepository.save.mockResolvedValue(mockNotification as any);

      const result = await service.createNotification({
        userId: 1,
        title: 'Title',
        message: 'Message',
        type: NotificationType.SYSTEM_ALERT,
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(notificationRepository.save).toHaveBeenCalled();
      expect(socketEmitterService.emitNewNotification).toHaveBeenCalledWith(
        'test@example.com',
        result,
      );
      expect(result.id).toEqual(1);
    });

    it('should throw error if user not found', async () => {
      /*
       * Flow: should throw error if user not found
       * 1. Setup mock data and dependencies.
       * 2. Execute the method under test.
       * 3. Verify the expected results and behavior.
       */
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.createNotification({
          userId: 1,
          title: 'Title',
          message: 'Message',
          type: NotificationType.SYSTEM_ALERT,
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});
