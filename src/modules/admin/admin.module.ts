import { SYSTEM_MESSAGE_QUEUE } from '@constants/queue.constant';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AccountHistoryRepository } from '@repositories/account-history.repository';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { SystemMessageProcessor } from '../../shared/queues/system-message.processor';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      UserRepository,
      AccountHistoryRepository,
      ConversationRepository,
      MessageRepository,
      ParticipantRepository,
    ]),
    BullModule.registerQueue({
      name: SYSTEM_MESSAGE_QUEUE,
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, SystemMessageProcessor],
  exports: [AdminService],
})
export class AdminModule {}
