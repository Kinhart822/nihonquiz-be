import { Injectable } from '@nestjs/common';
import { VocabularyRepository } from '@database/repository/vocabulary.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyFilterDto,
} from './dtos/vocabulary.req.dto';
import { VocabularyResDto } from './dtos/vocabulary.res.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class VocabularyService {
  constructor(
    private readonly vocabularyRepo: VocabularyRepository,
    private readonly lessonRepo: LessonRepository,
  ) {}

  // ==================== VALIDATION ====================
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

  private async validateVocabulary(id: number) {
    const vocabulary = await this.vocabularyRepo.getEntityById(id);
    if (!vocabulary) {
      throw new httpNotFound(
        httpErrors.VOCABULARY_NOT_FOUND.message,
        httpErrors.VOCABULARY_NOT_FOUND.code,
      );
    }
    return vocabulary;
  }

  // ==================== CREATE ====================
  async createVocabulary(dto: CreateVocabularyDto): Promise<VocabularyResDto> {
    await this.validateLesson(dto.lessonId);
    const vocabulary = await this.vocabularyRepo.createEntity(dto);
    return plainToInstance(VocabularyResDto, vocabulary, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getVocabulariesByLesson(
    lessonId: number,
    filterDto: VocabularyFilterDto,
  ): Promise<PageDto<VocabularyResDto>> {
    await this.validateLesson(lessonId);
    const { entities, total } =
      await this.vocabularyRepo.getVocabulariesWithFilters(lessonId, filterDto);
    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(VocabularyResDto, entities, {
      excludeExtraneousValues: true,
    });
    return new PageDto(data as unknown as VocabularyResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getVocabularyById(id: number): Promise<VocabularyResDto> {
    const vocabulary = await this.validateVocabulary(id);
    return plainToInstance(VocabularyResDto, vocabulary, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateVocabulary(
    id: number,
    dto: UpdateVocabularyDto,
  ): Promise<VocabularyResDto> {
    const vocabulary = await this.validateVocabulary(id);
    const updated = await this.vocabularyRepo.updateEntity(vocabulary, dto);
    return plainToInstance(VocabularyResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteVocabulary(id: number): Promise<void> {
    await this.validateVocabulary(id);
    await this.vocabularyRepo.deleteEntityById(id);
  }
}
