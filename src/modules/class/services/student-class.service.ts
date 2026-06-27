import { Injectable } from '@nestjs/common';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { plainToInstance } from 'class-transformer';
import { ClassAnnouncementRepository } from '../../../database/repository/class-announcement.repository';
import { ClassScheduleRepository } from '../../../database/repository/class-schedule.repository';
import { ClassStudentRepository } from '../../../database/repository/class-student.repository';
import { ClassRepository } from '../../../database/repository/class.repository';
import {
  httpBadRequest,
  httpErrors,
} from '../../../shared/exceptions/http-exception';
import {
  ClassStudentFilterDto,
  GetMyClassesQueryDto,
  JoinClassDto,
} from '../dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
  ClassScheduleResDto,
  ClassStudentResDto,
} from '../dtos/class.res.dto';
import { UserResDto } from '@modules/user/dtos/user.res.dto';

@Injectable()
export class StudentClassService {
  constructor(
    private readonly classRepo: ClassRepository,
    private readonly classStudentRepo: ClassStudentRepository,
    private readonly classAnnouncementRepo: ClassAnnouncementRepository,
    private readonly classScheduleRepo: ClassScheduleRepository,
  ) {}

  // ==================== GET MY CLASSES ====================
  async getMyClasses(
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
    studentId: number,
    classId: number,
  ): Promise<ClassResDto> {
    const classStudent = await this.classStudentRepo.findOne({
      where: { studentId, classId },
      relations: { class: true },
    });

    if (!classStudent) {
      throw new httpBadRequest(
        httpErrors.STUDENT_NOT_IN_CLASS.message,
        httpErrors.STUDENT_NOT_IN_CLASS.code,
      );
    }
    return plainToInstance(ClassResDto, classStudent.class, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== JOIN BY CODE ====================
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
    const classStudent = this.classStudentRepo.create({
      classId: classEntity.id,
      studentId: studentId,
    });
    await this.classStudentRepo.save(classStudent);
    return { message: 'Joined class successfully' };
  }

  // ==================== LEAVE ====================
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

  // ==================== GET MEMBERS ====================
  async getClassMembers(
    studentId: number,
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

    // Verify membership first
    const isMember = await this.classStudentRepo.findOneBy({
      classId,
      studentId,
    });
    if (!isMember) {
      throw new httpBadRequest(
        httpErrors.STUDENT_NOT_IN_CLASS.message,
        httpErrors.STUDENT_NOT_IN_CLASS.code,
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

  // ==================== GET ANNOUNCEMENTS ====================
  async getAnnouncements(
    studentId: number,
    classId: number,
  ): Promise<ClassAnnouncementResDto[]> {
    const isMember = await this.classStudentRepo.findOneBy({
      classId,
      studentId,
    });
    if (!isMember) {
      throw new httpBadRequest(
        httpErrors.STUDENT_NOT_IN_CLASS.message,
        httpErrors.STUDENT_NOT_IN_CLASS.code,
      );
    }

    const announcements = await this.classAnnouncementRepo.find({
      where: { classId },
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(ClassAnnouncementResDto, announcements, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET SCHEDULES ====================
  async getSchedules(
    studentId: number,
    classId: number,
  ): Promise<ClassScheduleResDto[]> {
    const isMember = await this.classStudentRepo.findOneBy({
      classId,
      studentId,
    });
    if (!isMember) {
      throw new httpBadRequest(
        httpErrors.STUDENT_NOT_IN_CLASS.message,
        httpErrors.STUDENT_NOT_IN_CLASS.code,
      );
    }

    const schedules = await this.classScheduleRepo.find({
      where: { classId },
    });

    return plainToInstance(ClassScheduleResDto, schedules, {
      excludeExtraneousValues: true,
    });
  }
}
