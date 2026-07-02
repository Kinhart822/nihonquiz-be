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
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';

// Mock Transactional Decorator
jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepo: jest.Mocked<UserRepository>;
  let configService: jest.Mocked<ConfigService>;
  let fileUploadQueue: any;

  beforeEach(async () => {
    const mockUserRepo = {
      getEntityById: jest.fn(),
      updateEntity: jest.fn(),
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
          useValue: mockUserRepo,
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
    userRepo = module.get(UserRepository);
    configService = module.get(ConfigService);
    fileUploadQueue = module.get(getQueueToken(FILE_UPLOAD_QUEUE));
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  describe('getProfile', () => {
    it('should throw an error if user not found', async () => {
      /*
       * Flow: Get User Profile (Not Found)
       * 1. Query User DB by ID.
       * 2. If null, throw NotFound exception.
       */
      userRepo.getEntityById.mockResolvedValue(null);

      await expect(service.getProfile(1)).rejects.toThrow(httpNotFound);
      expect(userRepo.getEntityById).toHaveBeenCalledWith(1);
    });

    it('should return user profile if user exists', async () => {
      /*
       * Flow: Get User Profile (Success)
       * 1. Query User DB by ID.
       * 2. If exists, return user entity.
       */
      const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };
      userRepo.getEntityById.mockResolvedValue(mockUser as any);

      const result = await service.getProfile(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(userRepo.getEntityById).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should throw an error if user not found', async () => {
      /*
       * Flow: Update Profile (User Not Found)
       * 1. Attempt to find the user in DB.
       * 2. If user doesn't exist, throw NotFound exception.
       */
      userRepo.getEntityById.mockResolvedValue(null);

      await expect(service.updateProfile(1, {})).rejects.toThrow(httpNotFound);
    });

    it('should throw an error if username already exists', async () => {
      /*
       * Flow: Update Profile (Duplicate Username)
       * 1. Check if the updated username exists for ANOTHER user in DB.
       * 2. If duplicate, throw BadRequest exception.
       */
      const mockUser = { id: 1, username: 'olduser' };
      userRepo.getEntityById.mockResolvedValue(mockUser as any);
      userRepo.existsBy.mockResolvedValue(true);

      await expect(
        service.updateProfile(1, { username: 'newuser' }),
      ).rejects.toThrow(httpBadRequest);
      expect(userRepo.existsBy).toHaveBeenCalledWith({
        username: 'newuser',
      });
    });

    it('should throw an error if avatar file is too large', async () => {
      /*
       * Flow: Update Profile (Avatar File Too Large)
       * 1. Read MAX_SIZE from ConfigService.
       * 2. Check uploaded file size against MAX_SIZE.
       * 3. If file exceeds the limit, throw BadRequest exception.
       */
      const mockUser = { id: 1, username: 'olduser' };
      userRepo.getEntityById.mockResolvedValue(mockUser as any);
      configService.get.mockReturnValue(100); // 100 bytes max

      const avatarFile = { size: 200, originalname: 'avatar.png' } as any;

      await expect(service.updateProfile(1, {}, avatarFile)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should queue avatar file upload if provided', async () => {
      /*
       * Flow: Update Profile (Upload Avatar Success)
       * 1. Verify user exists and file is within size limits.
       * 2. Update basic string fields (e.g. description).
       * 3. Queue the avatar file into FILE_UPLOAD_QUEUE.
       * 4. Save DB record & return success message.
       */
      const mockUser: any = { id: 1, username: 'olduser' };
      userRepo.getEntityById.mockResolvedValue(mockUser);
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
      expect(userRepo.updateEntity).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
      );
      expect(result).toEqual({ message: UPDATE_PROFILE_RES });
    });

    it('should queue background file upload if provided', async () => {
      /*
       * Flow: Update Profile (Upload Background Success)
       * 1. Verify user exists and file is within size limits.
       * 2. Queue the background file into FILE_UPLOAD_QUEUE.
       * 3. Save DB record & return success message.
       */
      const mockUser = { id: 1, username: 'olduser' };
      userRepo.getEntityById.mockResolvedValue(mockUser as any);
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
      expect(userRepo.updateEntity).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
      );
      expect(result).toEqual({ message: UPDATE_PROFILE_RES });
    });
  });

  describe('changePassword', () => {
    it('should throw error if user not found', async () => {
      /*
       * Flow: Change Password - User Not Found
       * 1. Query user by ID.
       * 2. If user does not exist, throw NotFound exception.
       */
      userRepo.getEntityById.mockResolvedValue(null);

      await expect(
        service.changePassword(1, { oldPassword: 'old', newPassword: 'new' }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should throw error if user has no password', async () => {
      /*
       * Flow: Change Password - No Existing Password
       * 1. Query user by ID.
       * 2. If user exists but has no password (e.g. social login), throw BadRequest exception.
       */
      userRepo.getEntityById.mockResolvedValue({ id: 1 } as any);

      await expect(
        service.changePassword(1, { oldPassword: 'old', newPassword: 'new' }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should throw error if old password does not match', async () => {
      /*
       * Flow: Change Password - Invalid Old Password
       * 1. Query user by ID.
       * 2. Compare provided old password with stored hashed password.
       * 3. If mismatch, throw BadRequest exception.
       */
      userRepo.getEntityById.mockResolvedValue({
        id: 1,
        password: 'hashed',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(1, { oldPassword: 'old', newPassword: 'new' }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should change password successfully', async () => {
      /*
       * Flow: Change Password - Success
       * 1. Retrieve user and verify old password matches.
       * 2. Hash the new password.
       * 3. Update user entity and save to DB.
       */
      const mockUser = { id: 1, password: 'old_hashed' };
      userRepo.getEntityById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');

      const result = await service.changePassword(1, {
        oldPassword: 'old',
        newPassword: 'new',
      });

      expect(mockUser.password).toBe('new_hashed');
      expect(userRepo.updateEntity).toHaveBeenCalledWith(
        mockUser,
        expect.any(Object),
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });
});
