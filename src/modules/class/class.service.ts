import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ClassStudentStatus } from '../../constants/class.constant';
import { RoleUser } from '../../constants/user.constant';
import { ClassAnnouncementRepository } from '../../database/repository/class-announcement.repository';
import { ClassScheduleRepository } from '../../database/repository/class-schedule.repository';
import { ClassStudentRepository } from '../../database/repository/class-student.repository';
import { ClassRepository } from '../../database/repository/class.repository';
import { PageMetaDto } from '../../shared/dtos/page-meta.dto';
import { PageDto } from '../../shared/dtos/page.dto';
import { JwtPayloadDto } from '../../shared/dtos/jwt-payload.dto';
import {
  httpBadRequest,
  httpErrors,
} from '../../shared/exceptions/http-exception';
import { UserResDto } from '../user/dtos/user.res.dto';
import {
  AssignTeacherDto,
  ClassFilterDto,
  ClassStudentFilterDto,
  CreateClassAnnouncementDto,
  CreateClassDto,
  EnrollStudentDto,
  GetMyClassesQueryDto,
  JoinClassDto,
  UpdateClassDto,
} from './dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
  ClassScheduleResDto,
  ClassStudentResDto,
} from './dtos/class.res.dto';

@Injectable()
export class ClassService {
  constructor(
    private readonly classRepo: ClassRepository,
    private readonly classStudentRepo: ClassStudentRepository,
    private readonly classAnnouncementRepo: ClassAnnouncementRepository,
    private readonly classScheduleRepo: ClassScheduleRepository,
  ) {}

  // ==================== CHECK ACCESS HELPER ====================
  private async checkClassAccess(user: JwtPayloadDto, classId: number) {
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

    if (user.role === RoleUser.ADMIN) {
      return classEntity;
    }

    if (user.role === RoleUser.TEACHER) {
      if (classEntity.teacherId !== user.id) {
        throw new httpBadRequest(
          httpErrors.UNAUTHORIZED_ACCESS.message,
          httpErrors.UNAUTHORIZED_ACCESS.code,
        );
      }
      return classEntity;
    }

    if (user.role === RoleUser.STUDENT) {
      const isMember = await this.classStudentRepo.findOneBy({
        classId,
        studentId: user.id,
      });
      if (!isMember) {
        throw new httpBadRequest(
          httpErrors.STUDENT_NOT_IN_CLASS.message,
          httpErrors.STUDENT_NOT_IN_CLASS.code,
        );
      }
      return classEntity;
    }

    throw new httpBadRequest(
      httpErrors.INVALID_ROLE.message,
      httpErrors.INVALID_ROLE.code,
    );
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

  async getTeachingClasses(
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

  async getEnrolledClasses(
    studentId: number,
    filterDto: GetMyClassesQueryDto,
  ): Promise<PageDto<ClassResDto>> {
    const { entities, total } =
      await this.classStudentRepo.getMyClassesWithFilters(studentId, filterDto);

    const mappedEntities = entities.map((cs) => cs.class);
    const pageMetaDto = new PageMetaDto(filterDto, total);

    return new PageDto(
      plainToInstance(ClassResDto, mappedEntities, {
        excludeExtraneousValues: true,
      }),
      pageMetaDto,
    );
  }

  // ==================== GET DETAILS ====================
  async getClassDetails(
    user: JwtPayloadDto,
    classId: number,
  ): Promise<ClassResDto> {
    const classEntity = await this.checkClassAccess(user, classId);
    return plainToInstance(ClassResDto, classEntity, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== CREATE & UPDATE ====================
  async createClass(dto: CreateClassDto) {
    const newClass = this.classRepo.create(dto);
    const saved = await this.classRepo.save(newClass);
    return plainToInstance(ClassResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async updateClass(user: JwtPayloadDto, classId: number, dto: UpdateClassDto) {
    const classEntity = await this.checkClassAccess(user, classId);
    Object.assign(classEntity, dto);
    const saved = await this.classRepo.save(classEntity);
    return plainToInstance(ClassResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

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

  // ==================== TEACHER MANAGEMENT ====================
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

  // ==================== STUDENT MANAGEMENT ====================
  async joinClassByCode(studentId: number, dto: JoinClassDto) {
    const classEntity = await this.classRepo.findOneBy({
      code: dto.code,
    });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.INVALID_CLASS_CODE.message,
        httpErrors.INVALID_CLASS_CODE.code,
      );
    }
    const exists = await this.classStudentRepo.findOneBy({
      classId: classEntity.id,
      studentId: studentId,
    });
    if (exists) {
      return { message: 'Already joined' };
    }
    const classStudent = this.classStudentRepo.create({
      classId: classEntity.id,
      studentId: studentId,
    });
    await this.classStudentRepo.save(classStudent);
    return { message: 'Joined class successfully' };
  }

  async enrollStudent(classId: number, dto: EnrollStudentDto) {
    const classEntity = await this.classRepo.findOneBy({ id: classId });
    if (!classEntity) {
      throw new httpBadRequest(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    const exists = await this.classStudentRepo.findOneBy({
      classId,
      studentId: dto.studentId,
    });
    if (!exists) {
      const classStudent = this.classStudentRepo.create({
        classId: classId,
        studentId: dto.studentId,
      });
      await this.classStudentRepo.save(classStudent);
    }
    return { message: 'Student enrolled successfully' };
  }

  async leaveClass(studentId: number, classId: number) {
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
    return { message: 'Left class successfully' };
  }

  async removeStudent(classId: number, studentId: number) {
    return this.leaveClass(studentId, classId);
  }

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

  async getClassMembers(
    user: JwtPayloadDto,
    classId: number,
    filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    const classEntity = await this.checkClassAccess(user, classId);

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

  // ==================== ANNOUNCEMENTS ====================
  async createAnnouncement(
    user: JwtPayloadDto,
    classId: number,
    dto: CreateClassAnnouncementDto,
  ) {
    await this.checkClassAccess(user, classId);
    if (user.role === RoleUser.STUDENT) {
      throw new httpBadRequest(
        httpErrors.UNAUTHORIZED_ACCESS.message,
        httpErrors.UNAUTHORIZED_ACCESS.code,
      );
    }

    const announcement = this.classAnnouncementRepo.create({
      ...dto,
      classId,
      authorId: user.id,
    });
    const saved = await this.classAnnouncementRepo.save(announcement);
    return plainToInstance(ClassAnnouncementResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async getAnnouncements(
    user: JwtPayloadDto,
    classId: number,
  ): Promise<ClassAnnouncementResDto[]> {
    await this.checkClassAccess(user, classId);

    const announcements = await this.classAnnouncementRepo.find({
      where: { classId },
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ClassAnnouncementResDto, announcements, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== SCHEDULES ====================
  async getSchedules(
    user: JwtPayloadDto,
    classId: number,
  ): Promise<ClassScheduleResDto[]> {
    await this.checkClassAccess(user, classId);

    const schedules = await this.classScheduleRepo.find({
      where: { classId },
    });

    return plainToInstance(ClassScheduleResDto, schedules, {
      excludeExtraneousValues: true,
    });
  }
}
