import {
  NOTIFICATION_MESSAGES,
  NotificationType,
} from '@constants/notification.constant';
import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import {
  AssignmentAttachmentStatus,
  AssignmentAttachmentType,
} from '@constants/user.constant';
import { AssignmentAttachmentRepository } from '@database/repository/assignment-attachment.repository';
import { AssignmentSubmissionAttachmentRepository } from '@database/repository/assignment-submission-attachment.repository';
import { AssignmentSubmissionRepository } from '@database/repository/assignment-submission.repository';
import { AssignmentRepository } from '@database/repository/assignment.repository';
import { ClassStudentRepository } from '@database/repository/class-student.repository';
import { ClassRepository } from '@database/repository/class.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { Transactional } from 'typeorm-transactional';
import { NotificationService } from '../notification/notification.service';
import {
  AssignmentFilterDto,
  CreateAssignmentDto,
  GradeAssignmentDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dtos/assignment.req.dto';
import {
  AssignmentResDto,
  AssignmentSubmissionResDto,
} from './dtos/assignment.res.dto';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly assignmentRepo: AssignmentRepository,
    private readonly submissionRepo: AssignmentSubmissionRepository,
    private readonly classRepo: ClassRepository,
    private readonly assignmentAttachmentRepo: AssignmentAttachmentRepository,
    private readonly submissionAttachmentRepo: AssignmentSubmissionAttachmentRepository,
    @InjectQueue(FILE_UPLOAD_QUEUE) private readonly fileUploadQueue: Queue,
    private readonly classStudentRepo: ClassStudentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  // ==================== VALIDATION ====================
  private async validateClass(classId: number) {
    const cls = await this.classRepo.getEntityById(classId);
    if (!cls) {
      throw new httpNotFound(
        httpErrors.CLASS_NOT_FOUND.message,
        httpErrors.CLASS_NOT_FOUND.code,
      );
    }
    return cls;
  }

  private async validateAssignment(id: number) {
    const assignment = await this.assignmentRepo.getEntityById(id);
    if (!assignment) {
      throw new httpNotFound(
        httpErrors.ASSIGNMENT_NOT_FOUND.message,
        httpErrors.ASSIGNMENT_NOT_FOUND.code,
      );
    }
    return assignment;
  }

  // ==================== ASSIGNMENT (TEACHER) ====================

  @Transactional()
  async createAssignment(
    dto: CreateAssignmentDto,
    files?: Express.Multer.File[],
  ): Promise<AssignmentResDto> {
    await this.validateClass(dto.classId);

    // Ensure dueDate is valid
    const dueDate = new Date(dto.dueDate);
    if (dueDate <= new Date()) {
      throw new httpBadRequest(
        httpErrors.INVALID_DUE_DATE.message,
        httpErrors.INVALID_DUE_DATE.code,
      );
    }

    const entity = await this.assignmentRepo.createEntity(dto);

    if (files && files.length > 0) {
      const maxSize = 5 * 1024 * 1024;
      for (const file of files) {
        if (file.size > maxSize) {
          throw new httpBadRequest(
            httpErrors.FILE_TOO_LARGE(file.originalname).message,
            httpErrors.FILE_TOO_LARGE(file.originalname).code,
          );
        }
      }

      const attachmentsData = files.map((file) => ({
        assignmentId: entity.id,
        type: AssignmentAttachmentType.FILE,
        status: AssignmentAttachmentStatus.PENDING,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      }));

      const attachments = await this.assignmentAttachmentRepo.createEntities(
        attachmentsData as any,
      );

      for (let i = 0; i < files.length; i++) {
        await this.fileUploadQueue.add(
          FILE_UPLOAD_JOB.UPLOAD_ASSIGNMENT_ATTACHMENT,
          {
            assignmentId: entity.id,
            attachmentId: attachments[i].id,
            file: {
              buffer: files[i].buffer,
              originalname: files[i].originalname,
              mimetype: files[i].mimetype,
              size: files[i].size,
            },
          },
        );
      }
    }

    // Notify all students in the class
    const classStudents = await this.classStudentRepo.find({
      where: { classId: dto.classId },
    });
    const notificationPromises = classStudents.map((cs) =>
      this.notificationService.createNotification({
        userId: cs.studentId,
        type: NotificationType.ASSIGNMENT_CREATED,
        title: NOTIFICATION_MESSAGES[NotificationType.ASSIGNMENT_CREATED].title,
        message: NOTIFICATION_MESSAGES[
          NotificationType.ASSIGNMENT_CREATED
        ].message(entity.title),
        metadata: { assignmentId: entity.id, classId: dto.classId },
      }),
    );
    await Promise.all(notificationPromises).catch((err) =>
      console.error('Failed to send ASSIGNMENT_CREATED notifications', err),
    );

    // Return created assignment
    return plainToInstance(AssignmentResDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  async updateAssignment(
    id: number,
    dto: UpdateAssignmentDto,
  ): Promise<AssignmentResDto> {
    const assignment = await this.validateAssignment(id);

    if (dto.dueDate) {
      const dueDate = new Date(dto.dueDate);
      if (dueDate <= new Date()) {
        throw new httpBadRequest(
          httpErrors.INVALID_DUE_DATE.message,
          httpErrors.INVALID_DUE_DATE.code,
        );
      }
    }

    const updated = await this.assignmentRepo.updateEntity(assignment, dto);
    return plainToInstance(AssignmentResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async deleteAssignment(id: number): Promise<void> {
    await this.validateAssignment(id);
    await this.assignmentRepo.deleteEntityById(id);
  }

  // ==================== ASSIGNMENT (STUDENT & TEACHER) ====================

  async getAssignmentsByClass(
    classId: number,
    filterDto: AssignmentFilterDto,
  ): Promise<PageDto<AssignmentResDto>> {
    await this.validateClass(classId);

    const [entities, total] = await this.assignmentRepo.findAndCount({
      where: { classId },
      order: { createdAt: 'DESC' },
      skip: filterDto.skip,
      take: filterDto.limit,
    });

    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(AssignmentResDto, entities, {
      excludeExtraneousValues: true,
    });

    return new PageDto(data as unknown as AssignmentResDto[], meta);
  }

  // ==================== SUBMISSION (STUDENT) ====================

  @Transactional()
  async submitAssignment(
    assignmentId: number,
    studentId: number,
    dto: SubmitAssignmentDto,
    files?: Express.Multer.File[],
  ): Promise<AssignmentSubmissionResDto> {
    const assignment = await this.validateAssignment(assignmentId);

    if (new Date(assignment.dueDate) < new Date()) {
      throw new httpBadRequest(
        httpErrors.DEADLINE_PASSED.message,
        httpErrors.DEADLINE_PASSED.code,
      );
    }

    let submission = await this.submissionRepo.findOne({
      where: { assignmentId, studentId },
    });

    if (submission) {
      submission = await this.submissionRepo.updateEntity(submission, {
        content: dto.content,
      });
    } else {
      submission = await this.submissionRepo.createEntity({
        assignmentId,
        studentId,
        content: dto.content,
      });
    }

    if (files && files.length > 0) {
      const maxSize = 5 * 1024 * 1024;
      for (const file of files) {
        if (file.size > maxSize) {
          throw new httpBadRequest(
            httpErrors.FILE_TOO_LARGE(file.originalname).message,
            httpErrors.FILE_TOO_LARGE(file.originalname).code,
          );
        }
      }

      const attachmentsData = files.map((file) => ({
        submissionId: submission!.id,
        type: AssignmentAttachmentType.FILE,
        status: AssignmentAttachmentStatus.PENDING,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      }));

      const attachments = await this.submissionAttachmentRepo.createEntities(
        attachmentsData as any,
      );

      for (let i = 0; i < files.length; i++) {
        await this.fileUploadQueue.add(
          FILE_UPLOAD_JOB.UPLOAD_SUBMISSION_ATTACHMENT,
          {
            submissionId: submission!.id,
            attachmentId: attachments[i].id,
            file: {
              buffer: files[i].buffer,
              originalname: files[i].originalname,
              mimetype: files[i].mimetype,
              size: files[i].size,
            },
          },
        );
      }
    }

    return plainToInstance(AssignmentSubmissionResDto, submission, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GRADING (TEACHER) ====================

  async gradeSubmission(
    submissionId: number,
    dto: GradeAssignmentDto,
  ): Promise<AssignmentSubmissionResDto> {
    // Get submission and validate
    const submission = await this.submissionRepo.getEntityById(submissionId);
    if (!submission) {
      throw new httpNotFound(
        httpErrors.SUBMISSION_NOT_FOUND.message,
        httpErrors.SUBMISSION_NOT_FOUND.code,
      );
    }

    // Grade the submission
    const updated = await this.submissionRepo.updateEntity(submission, {
      score: dto.score,
      feedback: dto.feedback,
      gradedAt: new Date(),
    });

    // Notify the student
    await this.notificationService
      .createNotification({
        userId: submission.studentId,
        type: NotificationType.ASSIGNMENT_GRADED,
        title: NOTIFICATION_MESSAGES[NotificationType.ASSIGNMENT_GRADED].title,
        message: NOTIFICATION_MESSAGES[
          NotificationType.ASSIGNMENT_GRADED
        ].message(dto.score),
        metadata: {
          assignmentId: submission.assignmentId,
          submissionId: submission.id,
        },
      })
      .catch((err) =>
        console.error('Failed to send ASSIGNMENT_GRADED notification', err),
      );

    return plainToInstance(AssignmentSubmissionResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async getSubmissionsByAssignment(
    assignmentId: number,
  ): Promise<AssignmentSubmissionResDto[]> {
    await this.validateAssignment(assignmentId);

    const submissions = await this.submissionRepo.find({
      where: { assignmentId },
      relations: { student: true },
    });

    return plainToInstance(AssignmentSubmissionResDto, submissions, {
      excludeExtraneousValues: true,
    });
  }
}
