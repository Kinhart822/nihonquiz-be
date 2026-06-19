import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { UPDATE_PROFILE_RES } from '@constants/user.constant';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '@repositories/user.repository';
import {
  httpBadRequest,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { UserService } from './user.service';

// Mock Transactional Decorator
jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let configService: jest.Mocked<ConfigService>;
  let fileUploadQueue: any;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      existsBy: jest.fn(),
      save: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockFileUploadQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getQueueToken(FILE_UPLOAD_QUEUE),
          useValue: mockFileUploadQueue,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    configService = module.get(ConfigService);
    fileUploadQueue = module.get(getQueueToken(FILE_UPLOAD_QUEUE));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should throw an error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile(1)).rejects.toThrow(httpNotFound);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return user profile if user exists', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };
      userRepository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.getProfile(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('updateProfile', () => {
    it('should throw an error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(1, {})).rejects.toThrow(httpNotFound);
    });

    it('should throw an error if username already exists', async () => {
      const mockUser = { id: 1, username: 'olduser' };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.existsBy.mockResolvedValue(true);

      await expect(
        service.updateProfile(1, { username: 'newuser' }),
      ).rejects.toThrow(httpBadRequest);
      expect(userRepository.existsBy).toHaveBeenCalledWith({
        username: 'newuser',
      });
    });

    it('should throw an error if avatar file is too large', async () => {
      const mockUser = { id: 1, username: 'olduser' };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      configService.get.mockReturnValue(100); // 100 bytes max

      const avatarFile = { size: 200, originalname: 'avatar.png' } as any;

      await expect(service.updateProfile(1, {}, avatarFile)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should queue avatar file upload if provided', async () => {
      const mockUser: any = { id: 1, username: 'olduser' };
      userRepository.findOne.mockResolvedValue(mockUser);
      configService.get.mockReturnValue(1000); // 1000 bytes max

      const avatarFile = {
        size: 200,
        originalname: 'avatar.png',
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
      } as any;

      const result = await service.updateProfile(
        1,
        { description: 'new desc' },
        avatarFile,
      );

      expect(mockUser.description).toBe('new desc');
      expect(fileUploadQueue.add).toHaveBeenCalledWith(
        FILE_UPLOAD_JOB.UPLOAD_USER_AVATAR,
        {
          userId: 1,
          file: {
            buffer: avatarFile.buffer,
            originalname: avatarFile.originalname,
            mimetype: avatarFile.mimetype,
            size: avatarFile.size,
          },
        },
      );
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ message: UPDATE_PROFILE_RES });
    });

    it('should queue background file upload if provided', async () => {
      const mockUser = { id: 1, username: 'olduser' };
      userRepository.findOne.mockResolvedValue(mockUser as any);
      configService.get.mockReturnValue(1000);

      const bgFile = {
        size: 200,
        originalname: 'bg.png',
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
      } as any;

      const result = await service.updateProfile(
        1,
        { username: 'olduser' },
        undefined,
        bgFile,
      );

      expect(fileUploadQueue.add).toHaveBeenCalledWith(
        FILE_UPLOAD_JOB.UPLOAD_USER_BACKGROUND,
        {
          userId: 1,
          file: {
            buffer: bgFile.buffer,
            originalname: bgFile.originalname,
            mimetype: bgFile.mimetype,
            size: bgFile.size,
          },
        },
      );
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ message: UPDATE_PROFILE_RES });
    });
  });
});
