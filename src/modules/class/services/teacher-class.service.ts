import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ClassStudentStatus } from '../../../constants/class.constant';
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
  ClassFilterDto,
  ClassStudentFilterDto,
  CreateClassAnnouncementDto,
  UpdateClassDto,
} from '../dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
  ClassStudentResDto,
} from '../dtos/class.res.dto';

@Injectable()
export class TeacherClassService {
  constructor(
    private readonly classRepo: ClassRepository,
    private readonly classStudentRepo: ClassStudentRepository,
    private readonly classAnnouncementRepo: ClassAnnouncementRepository,
  ) {}

  // ==================== GET LIST ====================
  async getMyTeachingClasses(
    teacherId: number,
    filterDto: ClassFilterDto,
  ): Promise<PageDto<ClassResDto>> {
    const { entities, total } = await this.classRepo.getClassesWithFilters(
      teacherId,
      filterDto,
    );

    const pageMetaDto = new PageMetaDto(filterDto, total);

    return new PageDto(
      plainToInstance(ClassResDto, entities, { excludeExtraneousValues: true }),
      pageMetaDto,
    );
  }

  // ==================== UPDATE ====================
  async updateClass(teacherId: number, classId: number, dto: UpdateClassDto) {
    const classEntity = await this.classRepo.findOneBy({
      id: classId,
      teacherId,
    });
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

  // ==================== GENERATE CODE ====================
  async generateClassCode(teacherId: number, classId: number) {
    const classEntity = await this.classRepo.findOneBy({
      id: classId,
      teacherId,
    });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    classEntity.code = uuidv4().substring(0, 8).toUpperCase();
    await this.classRepo.save(classEntity);
    return { code: classEntity.code };
  }

  // ==================== GET MEMBERS ====================
  async getClassMembers(
    teacherId: number,
    classId: number,
    filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    const classEntity = await this.classRepo.findOne({
      where: { id: classId, teacherId },
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

    const teacherData = classEntity.teacher
      ? plainToInstance(UserResDto, classEntity.teacher, {
          excludeExtraneousValues: true,
        })
      : null;

    return { teacher: teacherData, students };
  }

  // ==================== UPDATE STUDENT STATUS ====================
  async updateStudentStatus(
    teacherId: number,
    classId: number,
    studentId: number,
    status: ClassStudentStatus,
  ) {
    const classEntity = await this.classRepo.findOneBy({
      id: classId,
      teacherId,
    });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
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
    classStudent.status = status;
    await this.classStudentRepo.save(classStudent);
    return { message: 'Student status updated successfully' };
  }

  // ==================== CREATE ANNOUNCEMENT ====================
  async createAnnouncement(
    teacherId: number,
    classId: number,
    dto: CreateClassAnnouncementDto,
  ) {
    const classEntity = await this.classRepo.findOneBy({
      id: classId,
      teacherId,
    });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    const announcement = this.classAnnouncementRepo.create({
      ...dto,
      classId,
      authorId: teacherId,
    });
    const saved = await this.classAnnouncementRepo.save(announcement);
    return plainToInstance(ClassAnnouncementResDto, saved, {
      excludeExtraneousValues: true,
    });
  }
}
