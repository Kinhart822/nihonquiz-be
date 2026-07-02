import { RoleUser } from '@constants/user.constant';
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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { PageDto } from '@shared/dtos/page.dto';
import {
  CreateGrammarDto,
  GrammarFilterDto,
  UpdateGrammarDto,
} from './dtos/grammar.req.dto';
import { GrammarResDto } from './dtos/grammar.res.dto';
import { GrammarService } from './grammar.service';

@ApiTags('Grammar')
@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create grammar' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GrammarResDto,
    description: 'Grammar created successfully',
  })
  async createGrammar(@Body() dto: CreateGrammarDto): Promise<GrammarResDto> {
    return this.grammarService.createGrammar(dto);
  }

  // ==================== GET LIST ====================
  @Get('lesson/:lessonId')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get grammars by lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GrammarResDto,
    description: 'List of grammars returned successfully',
  })
  async getGrammarsByLesson(
    @Param('lessonId') lessonId: string,
    @Query() filterDto: GrammarFilterDto,
  ): Promise<PageDto<GrammarResDto>> {
    return this.grammarService.getGrammarsByLesson(+lessonId, filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get grammar by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GrammarResDto,
    description: 'Grammar information returned successfully',
  })
  async getGrammarById(@Param('id') id: string): Promise<GrammarResDto> {
    return this.grammarService.getGrammarById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update grammar' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GrammarResDto,
    description: 'Grammar updated successfully',
  })
  async updateGrammar(
    @Param('id') id: string,
    @Body() dto: UpdateGrammarDto,
  ): Promise<GrammarResDto> {
    return this.grammarService.updateGrammar(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Delete grammar' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grammar deleted successfully',
  })
  async deleteGrammar(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.grammarService.deleteGrammar(+id);
    return { success: true };
  }
}
