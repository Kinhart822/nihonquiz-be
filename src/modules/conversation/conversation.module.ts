import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      UserRepository,
      ConversationRepository,
      MessageRepository,
      ParticipantRepository,
    ]),
    CloudinaryModule,
    BullModule.registerQueue({
      name: FILE_UPLOAD_QUEUE,
    }),
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
