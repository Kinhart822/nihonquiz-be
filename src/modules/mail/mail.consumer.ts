import { IMailType } from '@constants/mail.constant';
import { MAIL_QUEUE } from '@constants/queue.constant';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailLogRepository } from '@repositories/email-log.repository';
import type { Job } from 'bullmq';
import { IMailMessage } from './interfaces/mail.interface';
import { MailService } from './mail.service';
import { EmailLogEntity } from '@entities/email-log.entity';

@Injectable()
@Processor(MAIL_QUEUE, {
  concurrency: Number(process.env.MAIL_QUEUE_CONCURRENCY ?? 5),
})
export class MailConsumer extends WorkerHost {
  private readonly logger = new Logger(MailConsumer.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly emailLogRepo: EmailLogRepository,
  ) {
    super();
    this.logger.log(
      `[MAIL_CONSUMER] Worker initialized for queue: ${MAIL_QUEUE}`,
    );
  }

  onModuleInit() {
    this.logger.log(`[MAIL_CONSUMER] Module initialized, worker is ready`);
  }

  async process(job: Job<IMailMessage>): Promise<any> {
    const { email, token, type } = job.data;
    this.logger.log(`Processing job ${job.id} for ${email} [${type}]`);

    switch (type) {
      case IMailType.SIGN_UP:
        return await this.executeEmailTask(job, {
          subject: 'Sign Up',
          template: 'sign_up',
          action: () => this.mailService.sendSignUpEmail(email, token),
        });
      case IMailType.RESEND_EMAIL:
        return await this.executeEmailTask(job, {
          subject: 'Resend Code',
          template: 'resend_code',
          action: () => this.mailService.sendResendCodeEmail(email, token),
        });
      case IMailType.FORGOT_PASSWORD:
        return await this.executeEmailTask(job, {
          subject: 'Forgot Password',
          template: 'forgot_password',
          action: () => this.mailService.sendForgotPasswordEmail(email, token),
        });
      default:
        this.logger.warn(`Unknown email type: ${type}`);
        return null;
    }
  }

  /**
   * Private helper to handle logging and execution with retry support
   */
  private async executeEmailTask(
    job: Job<IMailMessage>,
    config: { subject: string; template: string; action: () => Promise<void> },
  ) {
    const { email, token, type } = job.data;
    const fromEmail = this.configService.get('MAIL_FROM');

    const emailLog = new EmailLogEntity({
      fromEmail,
      toEmail: email,
      subject: config.subject,
      template: config.template,
      type,
      context: JSON.stringify({ code: token }),
      status: 'PENDING',
    });

    try {
      await config.action();
      emailLog.status = 'SUCCESS';
      emailLog.error = null;
    } catch (error) {
      this.logger.error(
        `Failed to process job ${job.id} for ${email}`,
        (error as Error).stack,
      );
      emailLog.status = 'FAILED';
      emailLog.error = (error as Error).message;

      // Re-throw error to trigger BullMQ retry mechanism
      throw error;
    } finally {
      await this.emailLogRepo.save(emailLog);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<IMailMessage>) {
    this.logger.log(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<IMailMessage>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
