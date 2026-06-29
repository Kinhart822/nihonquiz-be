import { CourseRepository } from '@database/repository/course.repository';
import { Injectable } from '@nestjs/common';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';
import {
  CourseFilterDto,
  CreateCourseDto,
  UpdateCourseDto,
} from './dtos/course.req.dto';
import { CourseResDto } from './dtos/course.res.dto';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepo: CourseRepository) {}

  // ==================== VALIDATION ====================
  private async validateCourse(id: number) {
    const course = await this.courseRepo.getEntityById(id);
    if (!course) {
      throw new httpNotFound(
        httpErrors.COURSE_NOT_FOUND.message,
        httpErrors.COURSE_NOT_FOUND.code,
      );
    }
    return course;
  }

  // ==================== CREATE ====================
  async createCourse(dto: CreateCourseDto): Promise<CourseResDto> {
    const course = await this.courseRepo.createEntity(dto);
    return plainToInstance(CourseResDto, course, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getCourses(filterDto: CourseFilterDto): Promise<PageDto<CourseResDto>> {
    const { entities, total } =
      await this.courseRepo.getCoursesWithFilters(filterDto);

    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(CourseResDto, entities, {
      excludeExtraneousValues: true,
    });

    return new PageDto(data as unknown as CourseResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getCourseById(id: number): Promise<CourseResDto> {
    const course = await this.validateCourse(id);
    return plainToInstance(CourseResDto, course, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateCourse(id: number, dto: UpdateCourseDto): Promise<CourseResDto> {
    const course = await this.validateCourse(id);

    const updatedCourse = await this.courseRepo.updateEntity(course, dto);
    return plainToInstance(CourseResDto, updatedCourse, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteCourse(id: number): Promise<void> {
    await this.validateCourse(id);
    await this.courseRepo.deleteEntityById(id);
  }
}
