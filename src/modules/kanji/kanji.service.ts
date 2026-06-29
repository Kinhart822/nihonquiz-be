import { Injectable } from '@nestjs/common';
import { KanjiRepository } from '@database/repository/kanji.repository';
import {
  CreateKanjiDto,
  UpdateKanjiDto,
  KanjiFilterDto,
} from './dtos/kanji.req.dto';
import { KanjiResDto } from './dtos/kanji.res.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class KanjiService {
  constructor(private readonly kanjiRepo: KanjiRepository) {}

  private async validateKanji(id: number) {
    const kanji = await this.kanjiRepo.getEntityById(id);
    if (!kanji) {
      throw new httpNotFound(
        httpErrors.KANJI_NOT_FOUND.message,
        httpErrors.KANJI_NOT_FOUND.code,
      );
    }
    return kanji;
  }

  // ==================== CREATE ====================
  async createKanji(dto: CreateKanjiDto): Promise<KanjiResDto> {
    const kanji = await this.kanjiRepo.createEntity(dto);
    return plainToInstance(KanjiResDto, kanji, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getAllKanjis(filterDto: KanjiFilterDto): Promise<PageDto<KanjiResDto>> {
    const { entities, total } =
      await this.kanjiRepo.getKanjisWithFilters(filterDto);
    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(KanjiResDto, entities, {
      excludeExtraneousValues: true,
    });
    return new PageDto(data as unknown as KanjiResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getKanjiById(id: number): Promise<KanjiResDto> {
    const kanji = await this.validateKanji(id);
    return plainToInstance(KanjiResDto, kanji, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateKanji(id: number, dto: UpdateKanjiDto): Promise<KanjiResDto> {
    const kanji = await this.validateKanji(id);
    const updated = await this.kanjiRepo.updateEntity(kanji, dto);
    return plainToInstance(KanjiResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteKanji(id: number): Promise<void> {
    await this.validateKanji(id);
    await this.kanjiRepo.deleteEntityById(id);
  }
}
