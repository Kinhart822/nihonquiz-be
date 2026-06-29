import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { MiniQuizRepository } from '@database/repository/mini-quiz.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { MiniQuizService } from './mini-quiz.service';
import { MiniQuizController } from './mini-quiz.controller';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([MiniQuizRepository, LessonRepository]),
  ],
  controllers: [MiniQuizController],
  providers: [MiniQuizService],
  exports: [MiniQuizService],
})
export class MiniQuizModule {}
