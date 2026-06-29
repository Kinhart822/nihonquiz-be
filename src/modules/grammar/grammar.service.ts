import { Injectable } from '@nestjs/common';
import { GrammarRepository } from '@database/repository/grammar.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import {
  CreateGrammarDto,
  UpdateGrammarDto,
  GrammarFilterDto,
} from './dtos/grammar.req.dto';
import { GrammarResDto } from './dtos/grammar.res.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class GrammarService {
  constructor(
    private readonly grammarRepo: GrammarRepository,
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

  private async validateGrammar(id: number) {
    const grammar = await this.grammarRepo.getEntityById(id);
    if (!grammar) {
      throw new httpNotFound(
        httpErrors.GRAMMAR_NOT_FOUND.message,
        httpErrors.GRAMMAR_NOT_FOUND.code,
      );
    }
    return grammar;
  }

  // ==================== CREATE ====================
  async createGrammar(dto: CreateGrammarDto): Promise<GrammarResDto> {
    await this.validateLesson(dto.lessonId);
    const grammar = await this.grammarRepo.createEntity(dto);
    return plainToInstance(GrammarResDto, grammar, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getGrammarsByLesson(
    lessonId: number,
    filterDto: GrammarFilterDto,
  ): Promise<PageDto<GrammarResDto>> {
    await this.validateLesson(lessonId);
    const { entities, total } = await this.grammarRepo.getGrammarsWithFilters(
      lessonId,
      filterDto,
    );
    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(GrammarResDto, entities, {
      excludeExtraneousValues: true,
    });
    return new PageDto(data as unknown as GrammarResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getGrammarById(id: number): Promise<GrammarResDto> {
    const grammar = await this.validateGrammar(id);
    return plainToInstance(GrammarResDto, grammar, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateGrammar(
    id: number,
    dto: UpdateGrammarDto,
  ): Promise<GrammarResDto> {
    const grammar = await this.validateGrammar(id);
    const updated = await this.grammarRepo.updateEntity(grammar, dto);
    return plainToInstance(GrammarResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteGrammar(id: number): Promise<void> {
    await this.validateGrammar(id);
    await this.grammarRepo.deleteEntityById(id);
  }
}
