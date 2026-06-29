import { Injectable } from '@nestjs/common';
import { AssignmentRepository } from '@database/repository/assignment.repository';
import { AssignmentSubmissionRepository } from '@database/repository/assignment-submission.repository';
import { AssignmentAttachmentRepository } from '@database/repository/assignment-attachment.repository';
import { AssignmentSubmissionAttachmentRepository } from '@database/repository/assignment-submission-attachment.repository';
import { ClassRepository } from '@database/repository/class.repository';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { FILE_UPLOAD_QUEUE, FILE_UPLOAD_JOB } from '@constants/queue.constant';
import {
  AssignmentAttachmentStatus,
  AssignmentAttachmentType,
} from '@constants/user.constant';
import { Transactional } from 'typeorm-transactional';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeAssignmentDto,
  AssignmentFilterDto,
} from './dtos/assignment.req.dto';
import {
  AssignmentResDto,
  AssignmentSubmissionResDto,
} from './dtos/assignment.res.dto';
import { plainToInstance } from 'class-transformer';
import {
  httpNotFound,
  httpBadRequest,
  httpErrors,
} from '@shared/exceptions/http-exception';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly assignmentRepo: AssignmentRepository,
    private readonly submissionRepo: AssignmentSubmissionRepository,
    private readonly classRepo: ClassRepository,
    private readonly assignmentAttachmentRepo: AssignmentAttachmentRepository,
    private readonly submissionAttachmentRepo: AssignmentSubmissionAttachmentRepository,
    @InjectQueue(FILE_UPLOAD_QUEUE) private readonly fileUploadQueue: Queue,
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
    const submission = await this.submissionRepo.getEntityById(submissionId);
    if (!submission) {
      throw new httpNotFound(
        httpErrors.SUBMISSION_NOT_FOUND.message,
        httpErrors.SUBMISSION_NOT_FOUND.code,
      );
    }

    const updated = await this.submissionRepo.updateEntity(submission, {
      score: dto.score,
      feedback: dto.feedback,
      gradedAt: new Date(),
    });

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
