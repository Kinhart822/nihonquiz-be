import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { QuestionRepository } from '@database/repository/question.repository';
import { AnswerRepository } from '@database/repository/answer.repository';
import { PracticeTestRepository } from '@database/repository/practice-test.repository';
import { MiniQuizRepository } from '@database/repository/mini-quiz.repository';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { BullModule } from '@nestjs/bullmq';
import { QUESTION_BANK_QUEUE } from '@constants/queue.constant';
import { SocketModule } from '../socket/socket.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { QuestionBankProcessor } from '../../shared/queues/question-bank.processor';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      QuestionRepository,
      AnswerRepository,
      PracticeTestRepository,
      MiniQuizRepository,
    ]),
    BullModule.registerQueue({
      name: QUESTION_BANK_QUEUE,
    }),
    SocketModule,
    CloudinaryModule,
  ],
  controllers: [QuestionController],
  providers: [QuestionService, QuestionBankProcessor],
  exports: [QuestionService],
})
export class QuestionBankModule {}
