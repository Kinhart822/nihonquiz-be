import { Injectable } from '@nestjs/common';
import { MiniQuizRepository } from '@database/repository/mini-quiz.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import {
  CreateMiniQuizDto,
  UpdateMiniQuizDto,
  MiniQuizFilterDto,
} from './dtos/mini-quiz.req.dto';
import { MiniQuizResDto } from './dtos/mini-quiz.res.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MiniQuizService {
  constructor(
    private readonly miniQuizRepo: MiniQuizRepository,
    private readonly lessonRepo: LessonRepository,
  ) {}

  // ==================== HELPER METHODS ====================
  private async validateLesson(lessonId: number) {
    const lesson = await this.lessonRepo.getEntityById(lessonId);
    if (!lesson) {
      throw new httpNotFound(
        httpErrors.LESSON_NOT_FOUND.message,
        httpErrors.LESSON_NOT_FOUND.code,
      );
    }
    return lesson;
  }

  private async validateMiniQuiz(id: number) {
    const quiz = await this.miniQuizRepo.getEntityById(id);
    if (!quiz) {
      throw new httpNotFound(
        httpErrors.MINI_QUIZ_NOT_FOUND.message,
        httpErrors.MINI_QUIZ_NOT_FOUND.code,
      );
    }
    return quiz;
  }

  // ==================== CREATE ====================
  async createMiniQuiz(dto: CreateMiniQuizDto): Promise<MiniQuizResDto> {
    await this.validateLesson(dto.lessonId);
    const quiz = await this.miniQuizRepo.createEntity(dto);
    return plainToInstance(MiniQuizResDto, quiz, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getMiniQuizzesByLesson(
    lessonId: number,
    filterDto: MiniQuizFilterDto,
  ): Promise<PageDto<MiniQuizResDto>> {
    await this.validateLesson(lessonId);
    const { entities, total } =
      await this.miniQuizRepo.getMiniQuizzesByLessonWithFilters(
        lessonId,
        filterDto,
      );
    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(MiniQuizResDto, entities, {
      excludeExtraneousValues: true,
    });
    return new PageDto(data as unknown as MiniQuizResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getMiniQuizById(id: number): Promise<MiniQuizResDto> {
    const quiz = await this.validateMiniQuiz(id);
    return plainToInstance(MiniQuizResDto, quiz, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateMiniQuiz(
    id: number,
    dto: UpdateMiniQuizDto,
  ): Promise<MiniQuizResDto> {
    const quiz = await this.validateMiniQuiz(id);
    const updated = await this.miniQuizRepo.updateEntity(quiz, dto);
    return plainToInstance(MiniQuizResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteMiniQuiz(id: number): Promise<void> {
    await this.validateMiniQuiz(id);
    await this.miniQuizRepo.deleteEntityById(id);
  }
}
