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
import { CourseService } from './course.service';
import {
  CourseFilterDto,
  CreateCourseDto,
  UpdateCourseDto,
} from './dtos/course.req.dto';
import { CourseResDto } from './dtos/course.res.dto';

@ApiTags('Course')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CourseResDto,
  })
  async createCourse(@Body() dto: CreateCourseDto): Promise<CourseResDto> {
    return this.courseService.createCourse(dto);
  }

  // ==================== GET LIST ====================
  @Get()
  @ApiOperation({ summary: 'Get list of courses with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<CourseResDto>,
  })
  async getCourses(
    @Query() filterDto: CourseFilterDto,
  ): Promise<PageDto<CourseResDto>> {
    return this.courseService.getCourses(filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CourseResDto,
  })
  async getCourseById(@Param('id') id: string): Promise<CourseResDto> {
    return this.courseService.getCourseById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CourseResDto,
  })
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResDto> {
    return this.courseService.updateCourse(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: 'Delete a course' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  async deleteCourse(@Param('id') id: string): Promise<void> {
    return this.courseService.deleteCourse(+id);
  }
}
