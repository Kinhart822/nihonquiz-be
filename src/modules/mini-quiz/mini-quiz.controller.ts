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
  CreateMiniQuizDto,
  MiniQuizFilterDto,
  UpdateMiniQuizDto,
} from './dtos/mini-quiz.req.dto';
import { MiniQuizResDto } from './dtos/mini-quiz.res.dto';
import { MiniQuizService } from './mini-quiz.service';

@ApiTags('Mini Quiz')
@Controller('mini-quiz')
export class MiniQuizController {
  constructor(private readonly miniQuizService: MiniQuizService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create mini quiz' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: MiniQuizResDto,
    description: 'Mini quiz created successfully',
  })
  async createMiniQuiz(
    @Body() dto: CreateMiniQuizDto,
  ): Promise<MiniQuizResDto> {
    return this.miniQuizService.createMiniQuiz(dto);
  }

  // ==================== GET LIST ====================
  @Get('lesson/:lessonId')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get mini quizzes by lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MiniQuizResDto,
    description: 'List of mini quizzes returned successfully',
  })
  async getMiniQuizzesByLesson(
    @Param('lessonId') lessonId: string,
    @Query() filterDto: MiniQuizFilterDto,
  ): Promise<PageDto<MiniQuizResDto>> {
    return this.miniQuizService.getMiniQuizzesByLesson(+lessonId, filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get mini quiz by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MiniQuizResDto,
    description: 'Mini quiz information returned successfully',
  })
  async getMiniQuizById(@Param('id') id: string): Promise<MiniQuizResDto> {
    return this.miniQuizService.getMiniQuizById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update mini quiz' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MiniQuizResDto,
    description: 'Mini quiz updated successfully',
  })
  async updateMiniQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateMiniQuizDto,
  ): Promise<MiniQuizResDto> {
    return this.miniQuizService.updateMiniQuiz(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Delete mini quiz' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mini quiz deleted successfully',
  })
  async deleteMiniQuiz(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.miniQuizService.deleteMiniQuiz(+id);
    return { success: true };
  }
}
