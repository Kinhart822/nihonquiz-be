import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { RedisService } from '@modules/redis/redis.service';
import { MailerService } from '@nestjs-modules/mailer';
import { getQueueToken } from '@nestjs/bullmq';
import { MAIL_QUEUE } from '@constants/queue.constant';
import { IMailType } from '@constants/mail.constant';
import { httpErrors } from '@shared/exceptions/http-exception';
import { HttpException } from '@nestjs/common';
import * as codeUtils from '@utils/code';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

describe('MailService', () => {
  let service: MailService;
  let redisService: jest.Mocked<RedisService>;
  let mailerService: jest.Mocked<MailerService>;
  let emailQueue: any;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockEmailQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: getQueueToken(MAIL_QUEUE),
          useValue: mockEmailQueue,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    redisService = module.get(RedisService);
    mailerService = module.get(MailerService);
    emailQueue = module.get(getQueueToken(MAIL_QUEUE));

    jest.spyOn(codeUtils, 'generateOTP').mockReturnValue('123456');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSendOTP', () => {
    it('should generate OTP, save to Redis, and add to queue', async () => {
      // Arrange
      const email = 'test@example.com';
      const type = IMailType.SIGN_UP;
      redisService.get.mockResolvedValue(0);

      // Act
      const result = await service.generateAndSendOTP(email, type);

      // Assert
      expect(redisService.get).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalledTimes(2); // One for count, one for OTP
      expect(emailQueue.add).toHaveBeenCalledWith(
        MAIL_QUEUE,
        { email, token: '123456', type },
        expect.any(Object),
      );
      expect(result.email).toBe(email);
      expect(result.type).toBe(type);
    });

    it('should throw error if resend count >= 3', async () => {
      // Arrange
      const email = 'test@example.com';
      const type = IMailType.SIGN_UP;
      redisService.get.mockResolvedValue(3);

      // Act & Assert
      await expect(service.generateAndSendOTP(email, type)).rejects.toThrow(
        HttpException,
      );
      await expect(
        service.generateAndSendOTP(email, type),
      ).rejects.toMatchObject({
        response: {
          errorCode: httpErrors.TOO_MANY_RESENDS.code,
        },
      });
      expect(emailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('verifyOTP', () => {
    it('should return true and delete keys if OTP is valid and persist is false', async () => {
      // Arrange
      redisService.get.mockResolvedValue('123456');

      // Act
      const result = await service.verifyOTP(
        'test@example.com',
        '123456',
        IMailType.SIGN_UP,
      );

      // Assert
      expect(result).toBe(true);
      expect(redisService.del).toHaveBeenCalledTimes(2);
    });

    it('should return true and NOT delete keys if persist is true', async () => {
      // Arrange
      redisService.get.mockResolvedValue('123456');

      // Act
      const result = await service.verifyOTP(
        'test@example.com',
        '123456',
        IMailType.FORGOT_PASSWORD,
        true,
      );

      // Assert
      expect(result).toBe(true);
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should return false if OTP does not match', async () => {
      // Arrange
      redisService.get.mockResolvedValue('123456');

      // Act
      const result = await service.verifyOTP(
        'test@example.com',
        '654321',
        IMailType.SIGN_UP,
      );

      // Assert
      expect(result).toBe(false);
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should return false if OTP does not exist', async () => {
      // Arrange
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.verifyOTP(
        'test@example.com',
        '123456',
        IMailType.SIGN_UP,
      );

      // Assert
      expect(result).toBe(false);
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('clearOTP', () => {
    it('should delete both OTP and resend count keys', async () => {
      // Act
      await service.clearOTP('test@example.com', IMailType.SIGN_UP);

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(2);
    });
  });
});
