import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { GrammarRepository } from '@database/repository/grammar.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([GrammarRepository, LessonRepository]),
  ],
  controllers: [GrammarController],
  providers: [GrammarService],
  exports: [GrammarService],
})
export class GrammarModule {}
