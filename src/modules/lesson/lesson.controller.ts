import { RoleUser } from '@constants/user.constant';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  CreateLessonDto,
  LessonFilterDto,
  UpdateLessonDto,
} from './dtos/lesson.req.dto';
import { LessonResDto } from './dtos/lesson.res.dto';
import { LessonService } from './lesson.service';

@ApiTags('Lesson')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: LessonResDto,
  })
  async createLesson(@Body() dto: CreateLessonDto): Promise<LessonResDto> {
    return this.lessonService.createLesson(dto);
  }

  // ==================== GET LIST ====================
  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get list of lessons by course ID with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<LessonResDto>,
  })
  async getLessons(
    @Param('courseId') courseId: string,
    @Query() filterDto: LessonFilterDto,
  ): Promise<PageDto<LessonResDto>> {
    return this.lessonService.getLessons(+courseId, filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @ApiOperation({ summary: 'Get a lesson by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LessonResDto,
  })
  async getLessonById(@Param('id') id: string): Promise<LessonResDto> {
    return this.lessonService.getLessonById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LessonResDto,
  })
  async updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<LessonResDto> {
    return this.lessonService.updateLesson(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: 'Delete a lesson' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  async deleteLesson(@Param('id') id: string): Promise<void> {
    return this.lessonService.deleteLesson(+id);
  }
}
