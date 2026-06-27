import { Injectable } from '@nestjs/common';
import { LessonRepository } from '@database/repository/lesson.repository';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonFilterDto,
} from './dtos/lesson.req.dto';
import { LessonResDto } from './dtos/lesson.res.dto';
import { PageOptionsDto } from '@shared/dtos/page-option.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { plainToInstance } from 'class-transformer';
import { httpNotFound, httpErrors } from '@shared/exceptions/http-exception';

@Injectable()
export class LessonService {
  constructor(private readonly lessonRepo: LessonRepository) {}

  // ==================== HELPER METHODS ====================
  private async validateLesson(id: number) {
    const lesson = await this.lessonRepo.getEntityById(id);
    if (!lesson) {
      throw new httpNotFound(
        httpErrors.LESSON_NOT_FOUND.message,
        httpErrors.LESSON_NOT_FOUND.code,
      );
    }
    return lesson;
  }

  // ==================== CREATE ====================
  async createLesson(dto: CreateLessonDto): Promise<LessonResDto> {
    const lesson = await this.lessonRepo.createEntity(dto);
    return plainToInstance(LessonResDto, lesson, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getLessons(
    courseId: number,
    filterDto: LessonFilterDto,
  ): Promise<PageDto<LessonResDto>> {
    const { entities, total } = await this.lessonRepo.getLessonsWithFilters(
      courseId,
      filterDto,
    );

    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(LessonResDto, entities, {
      excludeExtraneousValues: true,
    });

    return new PageDto(data as unknown as LessonResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getLessonById(id: number): Promise<LessonResDto> {
    const lesson = await this.validateLesson(id);
    return plainToInstance(LessonResDto, lesson, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateLesson(id: number, dto: UpdateLessonDto): Promise<LessonResDto> {
    const lesson = await this.validateLesson(id);

    const updatedLesson = await this.lessonRepo.updateEntity(lesson, dto);
    return plainToInstance(LessonResDto, updatedLesson, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteLesson(id: number): Promise<void> {
    await this.validateLesson(id);
    await this.lessonRepo.deleteEntityById(id);
  }
}
