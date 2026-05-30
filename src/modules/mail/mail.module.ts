import { RedisCacheModule } from '@configs/cache.module';
import { MAIL_QUEUE } from '@constants/queue.constant';
import { EmailLogRepository } from '@database/repository/email-log.repository';
import { UserRepository } from '@database/repository/user.repository';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { join } from 'path';
import { MailConsumer } from './mail.consumer';
import { MailService } from './mail.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository, EmailLogRepository]),
    RedisCacheModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT') || 587,
          pool: true, // Enable pool to avoid creating new connection for each email
          maxConnections: 1,
          maxMessages: 100,
          rateDelta: 1000,
          rateLimit: 2,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `${configService.get<string>('MAIL_FROM')}`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: MAIL_QUEUE,
    }),
  ],
  controllers: [],
  providers: [MailService, MailConsumer],
  exports: [MailService, MailConsumer],
})
export class MailModule {}
