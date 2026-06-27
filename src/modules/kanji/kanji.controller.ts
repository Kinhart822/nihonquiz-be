import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { RoleUser } from '@constants/user.constant';
import { PageDto } from '@shared/dtos/page.dto';
import { KanjiService } from './kanji.service';
import {
  CreateKanjiDto,
  UpdateKanjiDto,
  KanjiFilterDto,
} from './dtos/kanji.req.dto';
import { KanjiResDto } from './dtos/kanji.res.dto';

@ApiTags('Kanji')
@ApiBearerAuth()
@Controller('kanji')
export class KanjiController {
  constructor(private readonly kanjiService: KanjiService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create kanji' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: KanjiResDto,
    description: 'Kanji created successfully',
  })
  async createKanji(@Body() dto: CreateKanjiDto): Promise<KanjiResDto> {
    return this.kanjiService.createKanji(dto);
  }

  // ==================== GET LIST ====================
  @Get('lesson/:lessonId')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get kanjis by lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: KanjiResDto,
    description: 'List of kanjis returned successfully',
  })
  async getKanjisByLesson(
    @Param('lessonId') lessonId: string,
    @Query() filterDto: KanjiFilterDto,
  ): Promise<PageDto<KanjiResDto>> {
    return this.kanjiService.getKanjisByLesson(+lessonId, filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get kanji by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: KanjiResDto,
    description: 'Kanji information returned successfully',
  })
  async getKanjiById(@Param('id') id: string): Promise<KanjiResDto> {
    return this.kanjiService.getKanjiById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update kanji' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: KanjiResDto,
    description: 'Kanji updated successfully',
  })
  async updateKanji(
    @Param('id') id: string,
    @Body() dto: UpdateKanjiDto,
  ): Promise<KanjiResDto> {
    return this.kanjiService.updateKanji(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Delete kanji' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kanji deleted successfully',
  })
  async deleteKanji(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.kanjiService.deleteKanji(+id);
    return { success: true };
  }
}
