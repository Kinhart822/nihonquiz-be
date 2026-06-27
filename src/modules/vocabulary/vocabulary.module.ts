import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { VocabularyRepository } from '@database/repository/vocabulary.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      VocabularyRepository,
      LessonRepository,
    ]),
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
