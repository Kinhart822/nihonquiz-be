import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ClassAnnouncementRepository } from '../../../database/repository/class-announcement.repository';
import { ClassStudentRepository } from '../../../database/repository/class-student.repository';
import { ClassRepository } from '../../../database/repository/class.repository';
import { PageMetaDto } from '../../../shared/dtos/page-meta.dto';
import { PageDto } from '../../../shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
} from '../../../shared/exceptions/http-exception';
import { UserResDto } from '../../user/dtos/user.res.dto';
import {
  AssignTeacherDto,
  ClassFilterDto,
  ClassStudentFilterDto,
  CreateClassAnnouncementDto,
  CreateClassDto,
  EnrollStudentDto,
  UpdateClassDto,
} from '../dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
  ClassStudentResDto,
} from '../dtos/class.res.dto';

@Injectable()
export class AdminClassService {
  constructor(
    private readonly classRepo: ClassRepository,
    private readonly classStudentRepo: ClassStudentRepository,
    private readonly classAnnouncementRepo: ClassAnnouncementRepository,
  ) {}

  // ==================== CREATE ====================
  async createClass(dto: CreateClassDto) {
    const newClass = this.classRepo.create(dto);
    const saved = await this.classRepo.save(newClass);
    return plainToInstance(ClassResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateClass(classId: number, dto: UpdateClassDto) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    Object.assign(classEntity, dto);
    const saved = await this.classRepo.save(classEntity);
    return plainToInstance(ClassResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== ASSIGN TEACHER ====================
  async assignTeacher(classId: number, dto: AssignTeacherDto) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    classEntity.teacherId = dto.teacherId;
    const saved = await this.classRepo.save(classEntity);
    return plainToInstance(ClassResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== ENROLL STUDENT ====================
  async enrollStudent(classId: number, dto: EnrollStudentDto) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    const classStudent = this.classStudentRepo.create({
      classId: classId,
      studentId: dto.studentId,
    });
    await this.classStudentRepo.save(classStudent);
    return { message: 'Student enrolled successfully' };
  }

  // ==================== REMOVE STUDENT ====================
  async removeStudent(classId: number, studentId: number) {
    const classStudent = await this.classStudentRepo.findOneBy({
      classId,
      studentId,
    });
    if (!classStudent) {
      throw new httpBadRequest(
        httpErrors.STUDENT_NOT_IN_CLASS.message,
        httpErrors.STUDENT_NOT_IN_CLASS.code,
      );
    }
    await this.classStudentRepo.remove(classStudent);
    return { message: 'Student removed successfully' };
  }

  // ==================== GET LIST ====================
  async getAllClasses(
    filterDto: ClassFilterDto,
  ): Promise<PageDto<ClassResDto>> {
    const { entities, total } = await this.classRepo.getClassesWithFilters(
      null,
      filterDto,
    );

    const pageMetaDto = new PageMetaDto(filterDto, total);

    return new PageDto(
      plainToInstance(ClassResDto, entities, { excludeExtraneousValues: true }),
      pageMetaDto,
    );
  }

  // ==================== DELETE ====================
  async deleteClass(classId: number) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    await this.classRepo.softRemove(classEntity);
    return { message: 'Class deleted successfully' };
  }

  // ==================== UPDATE STATUS ====================
  async updateClassStatus(classId: number, isActive: boolean) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    classEntity.isActive = isActive;
    await this.classRepo.save(classEntity);
    return { message: 'Class status updated successfully' };
  }

  // ==================== GET MEMBERS ====================
  async getClassMembers(
    classId: number,
    filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId },
      relations: { teacher: true },
    });

    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }

    const { entities, total } =
      await this.classStudentRepo.getStudentsWithFilters(classId, filterDto);

    const pageMetaDto = new PageMetaDto(filterDto, total);

    const students = new PageDto(
      plainToInstance(ClassStudentResDto, entities, {
        excludeExtraneousValues: true,
      }),
      pageMetaDto,
    );

    const teacher = classEntity.teacher
      ? plainToInstance(UserResDto, classEntity.teacher, {
          excludeExtraneousValues: true,
        })
      : null;

    return { teacher, students };
  }

  // ==================== CREATE ANNOUNCEMENT ====================
  async createAnnouncement(
    adminId: number,
    classId: number,
    dto: CreateClassAnnouncementDto,
  ) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    const announcement = this.classAnnouncementRepo.create({
      ...dto,
      classId,
      authorId: adminId,
    });
    const saved = await this.classAnnouncementRepo.save(announcement);
    return plainToInstance(ClassAnnouncementResDto, saved, {
      excludeExtraneousValues: true,
    });
  }
}
