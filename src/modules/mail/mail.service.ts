import { IMailType, MAIL_TITLE } from '@constants/mail.constant';
import { MAIL_QUEUE } from '@constants/queue.constant';
import {
  getRedisMailTypeOtp,
  getRedisOtpResendCountKey,
  MAIL_ACTION_TTL,
} from '@constants/redis.constant';
import { RedisService } from '@modules/redis/redis.service';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { httpBadRequest, httpErrors } from '@shared/exceptions/http-exception';
import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import { Transactional } from 'typeorm-transactional';
import { generateOTP } from '@utils/code';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly emailQueue: Queue,
    private readonly mailerService: MailerService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Add email job to queue
   */
  async sendEmailToQueue(email: string, token: string, type: IMailType) {
    const jobId = `${email}-${type}-${Date.now()}`;
    return await this.emailQueue.add(
      MAIL_QUEUE,
      { email, token, type },
      {
        attempts: 3,
        backoff: { type: 'fixed', delay: 2000 },
        removeOnComplete: true,
        jobId,
      },
    );
  }

  /**
   * OTP Logic
   */
  private async handleGenerateAndSaveOTP(
    email: string,
    type: IMailType,
  ): Promise<string> {
    const code = generateOTP();
    const redisKey = getRedisMailTypeOtp(email, type);

    await this.redisService.set(redisKey, code, MAIL_ACTION_TTL);
    return code;
  }

  private async checkAndIncrementResendCount(email: string, type: IMailType) {
    const resendKey = getRedisOtpResendCountKey(email, type);
    const count = (await this.redisService.get<number>(resendKey)) || 0;

    if (count >= 3) {
      httpBadRequest(
        httpErrors.TOO_MANY_RESENDS.message,
        httpErrors.TOO_MANY_RESENDS.code,
      );
    }

    await this.redisService.set(resendKey, count + 1, MAIL_ACTION_TTL);
  }

  @Transactional()
  async generateAndSendOTP(email: string, type: IMailType) {
    // Check and increment resend count
    await this.checkAndIncrementResendCount(email, type);

    const code = await this.handleGenerateAndSaveOTP(email, type);

    // Push to Queue for background sending
    await this.sendEmailToQueue(email, code, type);

    return {
      email,
      type,
      expiredAt: dayjs().add(MAIL_ACTION_TTL, 'millisecond').toDate(),
    };
  }

  /**
   * Verify OTP from Redis
   */
  async verifyOTP(
    email: string,
    code: string,
    type: IMailType,
    persist: boolean = false,
  ): Promise<boolean> {
    const redisKey = getRedisMailTypeOtp(email, type);
    const storedCode = await this.redisService.get<string>(redisKey);

    if (!storedCode || String(storedCode) !== String(code)) {
      return false;
    }

    if (persist) {
      return true;
    }

    // Delete code and resend count after successful verification
    await this.redisService.del(redisKey);
    await this.redisService.del(getRedisOtpResendCountKey(email, type));
    return true;
  }

  async isOTPExist(email: string, type: IMailType): Promise<boolean> {
    const redisKey = getRedisMailTypeOtp(email, type);
    return await this.redisService.exists(redisKey);
  }

  async clearOTP(email: string, type: IMailType): Promise<void> {
    const redisKey = getRedisMailTypeOtp(email, type);
    const resendKey = getRedisOtpResendCountKey(email, type);
    await this.redisService.del(redisKey);
    await this.redisService.del(resendKey);
  }

  /**
   *  Mail Sending Methods
   */
  async sendSignUpEmail(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: MAIL_TITLE.TC01,
      template: 'sign_up',
      context: { email, code: token },
    });
  }

  async sendResendCodeEmail(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: MAIL_TITLE.TC02,
      template: 'resend_code',
      context: { email, code: token },
    });
  }

  async sendForgotPasswordEmail(email: string, token: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: MAIL_TITLE.TC03,
      template: 'forgot_password',
      context: { email, code: token },
    });
  }

  async sendHTMLEmail(to: string, subject: string, html: string) {
    try {
      await this.mailerService.sendMail({ to, subject, html });
    } catch (error) {
      this.logger.error(`Failed to send HTML email to ${to}`, error);
    }
  }
}
