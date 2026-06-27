import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { KanjiRepository } from '@database/repository/kanji.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { KanjiController } from './kanji.controller';
import { KanjiService } from './kanji.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([KanjiRepository, LessonRepository]),
  ],
  controllers: [KanjiController],
  providers: [KanjiService],
  exports: [KanjiService],
})
export class KanjiModule {}
