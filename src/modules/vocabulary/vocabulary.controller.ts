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
import { VocabularyService } from './vocabulary.service';
import {
  CreateVocabularyDto,
  UpdateVocabularyDto,
  VocabularyFilterDto,
} from './dtos/vocabulary.req.dto';
import { VocabularyResDto } from './dtos/vocabulary.res.dto';

@ApiTags('Vocabulary')
@ApiBearerAuth()
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create vocabulary' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: VocabularyResDto,
    description: 'Vocabulary created successfully',
  })
  async createVocabulary(
    @Body() dto: CreateVocabularyDto,
  ): Promise<VocabularyResDto> {
    return this.vocabularyService.createVocabulary(dto);
  }

  // ==================== GET LIST ====================
  @Get('lesson/:lessonId')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get vocabularies by lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: VocabularyResDto,
    description: 'List of vocabularies returned successfully',
  })
  async getVocabulariesByLesson(
    @Param('lessonId') lessonId: string,
    @Query() filterDto: VocabularyFilterDto,
  ): Promise<PageDto<VocabularyResDto>> {
    return this.vocabularyService.getVocabulariesByLesson(+lessonId, filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get vocabulary by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: VocabularyResDto,
    description: 'Vocabulary information returned successfully',
  })
  async getVocabularyById(@Param('id') id: string): Promise<VocabularyResDto> {
    return this.vocabularyService.getVocabularyById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update vocabulary' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: VocabularyResDto,
    description: 'Vocabulary updated successfully',
  })
  async updateVocabulary(
    @Param('id') id: string,
    @Body() dto: UpdateVocabularyDto,
  ): Promise<VocabularyResDto> {
    return this.vocabularyService.updateVocabulary(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Delete vocabulary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vocabulary deleted successfully',
  })
  async deleteVocabulary(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.vocabularyService.deleteVocabulary(+id);
    return { success: true };
  }
}
