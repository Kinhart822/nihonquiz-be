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
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiProduces,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { RoleUser } from '@constants/user.constant';
import { PageDto } from '@shared/dtos/page.dto';
import { QuestionService } from './question.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilterDto,
} from './dtos/question.req.dto';
import { QuestionResDto } from './dtos/question.res.dto';
import { AuthUser } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';

@ApiTags('Question Bank')
@ApiBearerAuth()
@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create question' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: QuestionResDto,
    description: 'Question created successfully',
  })
  async createQuestion(
    @Body() dto: CreateQuestionDto,
  ): Promise<QuestionResDto> {
    return this.questionService.createQuestion(dto);
  }

  // ==================== GET LIST ====================
  @Get()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get questions' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: QuestionResDto,
    description: 'List of questions returned successfully',
  })
  async getQuestions(
    @Query() filterDto: QuestionFilterDto,
  ): Promise<PageDto<QuestionResDto>> {
    return this.questionService.getQuestions(filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get question by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: QuestionResDto,
    description: 'Question information returned successfully',
  })
  async getQuestionById(@Param('id') id: string): Promise<QuestionResDto> {
    return this.questionService.getQuestionById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: QuestionResDto,
    description: 'Question updated successfully',
  })
  async updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ): Promise<QuestionResDto> {
    return this.questionService.updateQuestion(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question deleted successfully',
  })
  async deleteQuestion(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.questionService.deleteQuestion(+id);
    return { success: true };
  }

  // ==================== IMPORT / EXPORT ====================
  @Get('export/excel')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Export questions to Excel (Background Task)' })
  async exportQuestions(
    @AuthUser() user: JwtPayloadDto,
    @Query('practiceTestId') practiceTestId?: string,
    @Query('miniQuizId') miniQuizId?: string,
  ) {
    return this.questionService.queueExportQuestions(
      user.email,
      practiceTestId ? +practiceTestId : undefined,
      miniQuizId ? +miniQuizId : undefined,
    );
  }

  @Post('import/excel')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Import questions from Excel (Background Task)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        practiceTestId: { type: 'number', nullable: true },
        miniQuizId: { type: 'number', nullable: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importQuestions(
    @AuthUser() user: JwtPayloadDto,
    @UploadedFile() file: Express.Multer.File,
    @Body('practiceTestId') practiceTestId?: string,
    @Body('miniQuizId') miniQuizId?: string,
  ) {
    return this.questionService.queueImportQuestions(
      user.email,
      file,
      practiceTestId ? +practiceTestId : undefined,
      miniQuizId ? +miniQuizId : undefined,
    );
  }
}
