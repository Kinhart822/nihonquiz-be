import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { PracticeTestRepository } from '@database/repository/practice-test.repository';
import { TestAttemptRepository } from '@database/repository/test-attempt.repository';
import { QuestionRepository } from '@database/repository/question.repository';
import { PracticeTestService } from './practice-test.service';
import { PracticeTestController } from './practice-test.controller';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      PracticeTestRepository,
      TestAttemptRepository,
      QuestionRepository,
    ]),
  ],
  controllers: [PracticeTestController],
  providers: [PracticeTestService],
  exports: [PracticeTestService],
})
export class PracticeTestModule {}
