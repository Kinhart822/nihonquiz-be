import { IMailType } from '@constants/mail.constant';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailLogRepository } from '@repositories/email-log.repository';
import { Job } from 'bullmq';
import { IMailMessage } from './interfaces/mail.interface';
import { MailConsumer } from './mail.consumer';
import { MailService } from './mail.service';

describe('MailConsumer', () => {
  let consumer: MailConsumer;
  let mailService: jest.Mocked<MailService>;
  let configService: jest.Mocked<ConfigService>;
  let emailLogRepo: jest.Mocked<EmailLogRepository>;

  const mockMailService = {
    sendSignUpEmail: jest.fn(),
    sendResendCodeEmail: jest.fn(),
    sendForgotPasswordEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('noreply@test.com'),
  };

  const mockEmailLogRepo = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailConsumer,
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailLogRepository, useValue: mockEmailLogRepo },
      ],
    }).compile();

    consumer = module.get<MailConsumer>(MailConsumer);
    mailService = module.get(MailService);
    configService = module.get(ConfigService);
    emailLogRepo = module.get(EmailLogRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    const mockJob = (type: IMailType): Job<IMailMessage> =>
      ({
        id: 'job-1',
        data: { email: 'test@example.com', token: '123456', type },
      }) as any;

    it('should process SIGN_UP and save email log successfully', async () => {
      // Arrange
      const job = mockJob(IMailType.SIGN_UP);
      mockMailService.sendSignUpEmail.mockResolvedValue(undefined);

      // Act
      await consumer.process(job);

      // Assert
      expect(mailService.sendSignUpEmail).toHaveBeenCalledWith(
        job.data.email,
        job.data.token,
      );
      expect(emailLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          type: IMailType.SIGN_UP,
          error: null,
        }),
      );
    });

    it('should process RESEND_EMAIL and save email log successfully', async () => {
      // Arrange
      const job = mockJob(IMailType.RESEND_EMAIL);
      mockMailService.sendResendCodeEmail.mockResolvedValue(undefined);

      // Act
      await consumer.process(job);

      // Assert
      expect(mailService.sendResendCodeEmail).toHaveBeenCalledWith(
        job.data.email,
        job.data.token,
      );
      expect(emailLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          type: IMailType.RESEND_EMAIL,
        }),
      );
    });

    it('should process FORGOT_PASSWORD and save email log successfully', async () => {
      // Arrange
      const job = mockJob(IMailType.FORGOT_PASSWORD);
      mockMailService.sendForgotPasswordEmail.mockResolvedValue(undefined);

      // Act
      await consumer.process(job);

      // Assert
      expect(mailService.sendForgotPasswordEmail).toHaveBeenCalledWith(
        job.data.email,
        job.data.token,
      );
      expect(emailLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          type: IMailType.FORGOT_PASSWORD,
        }),
      );
    });

    it('should handle mail service failure, save FAILED status, and re-throw', async () => {
      // Arrange
      const job = mockJob(IMailType.SIGN_UP);
      const error = new Error('SMTP Error');
      mockMailService.sendSignUpEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(consumer.process(job)).rejects.toThrow(error);
      expect(emailLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          error: 'SMTP Error',
        }),
      );
    });

    it('should return null for unknown mail type', async () => {
      // Arrange
      const job = mockJob('UNKNOWN_TYPE' as any);

      // Act
      const result = await consumer.process(job);

      // Assert
      expect(result).toBeNull();
      expect(emailLogRepo.save).not.toHaveBeenCalled();
    });
  });
});
