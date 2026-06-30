import { AdminModule } from '@modules/admin/admin.module';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageAttachmentRepository } from '@repositories/message-attachment.repository';
import { MessagePinRepository } from '@repositories/message-pin.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';

import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { SystemConfigModule } from '@modules/system-config/system-config.module';
import { BullModule } from '@nestjs/bullmq';
import { FileUploadProcessor } from '../../shared/queues/file-upload.processor';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      UserRepository,
      ConversationRepository,
      MessageRepository,
      ParticipantRepository,
      MessageAttachmentRepository,
      MessagePinRepository,
    ]),
    CloudinaryModule,
    AdminModule,
    SystemConfigModule,
    BullModule.registerQueue({
      name: FILE_UPLOAD_QUEUE,
    }),
    NotificationModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, FileUploadProcessor],
  exports: [MessageService],
})
export class MessageModule {}
