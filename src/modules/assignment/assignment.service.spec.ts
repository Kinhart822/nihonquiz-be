import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { AssignmentSubmissionEntity } from '@database/entities/assignment-submission.entity';
import { AssignmentEntity } from '@database/entities/assignment.entity';
import { ClassEntity } from '@database/entities/class.entity';
import { AssignmentAttachmentRepository } from '@database/repository/assignment-attachment.repository';
import { AssignmentSubmissionAttachmentRepository } from '@database/repository/assignment-submission-attachment.repository';
import { AssignmentSubmissionRepository } from '@database/repository/assignment-submission.repository';
import { AssignmentRepository } from '@database/repository/assignment.repository';
import { ClassStudentRepository } from '@database/repository/class-student.repository';
import { ClassRepository } from '@database/repository/class.repository';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import {
  httpBadRequest,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { NotificationService } from '../notification/notification.service';
import { AssignmentService } from './assignment.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

describe('AssignmentService', () => {
  let service: AssignmentService;
  let assignmentRepo: jest.Mocked<AssignmentRepository>;
  let submissionRepo: jest.Mocked<AssignmentSubmissionRepository>;
  let classRepo: jest.Mocked<ClassRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: AssignmentRepository,
          useValue: {
            getEntityById: jest.fn(),
            createEntity: jest.fn(),
            updateEntity: jest.fn(),
            deleteEntityById: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: AssignmentSubmissionRepository,
          useValue: {
            getEntityById: jest.fn(),
            findOne: jest.fn(),
            createEntity: jest.fn(),
            updateEntity: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: ClassRepository,
          useValue: {
            getEntityById: jest.fn(),
          },
        },
        {
          provide: AssignmentAttachmentRepository,
          useValue: {},
        },
        {
          provide: AssignmentSubmissionAttachmentRepository,
          useValue: {},
        },
        {
          provide: ClassStudentRepository,
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getQueueToken(FILE_UPLOAD_QUEUE),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
    assignmentRepo = module.get(AssignmentRepository);
    submissionRepo = module.get(AssignmentSubmissionRepository);
    classRepo = module.get(ClassRepository);
  });

  describe('createAssignment', () => {
    /*
     * Flow: Create Assignment (Class not found)
     * 1. Mock classRepo.getEntityById to return null
     * 2. Expect createAssignment to throw httpNotFound
     */
    it('should throw httpNotFound if class does not exist', async () => {
      classRepo.getEntityById.mockResolvedValue(null);

      await expect(
        service.createAssignment({
          title: 'Test',
          dueDate: new Date(Date.now() + 10000).toISOString(),
          classId: 1,
        }),
      ).rejects.toThrow(httpNotFound);
    });

    /*
     * Flow: Create Assignment (Past due date)
     * 1. Mock classRepo.getEntityById to return a valid class
     * 2. Expect createAssignment to throw httpBadRequest because dueDate is in the past
     */
    it('should throw httpBadRequest if due date is in the past', async () => {
      classRepo.getEntityById.mockResolvedValue({ id: 1 } as ClassEntity);

      await expect(
        service.createAssignment({
          title: 'Test',
          dueDate: new Date(Date.now() - 10000).toISOString(), // Past
          classId: 1,
        }),
      ).rejects.toThrow(httpBadRequest);
    });

    /*
     * Flow: Create Assignment Success
     * 1. Mock classRepo.getEntityById to return a valid class
     * 2. Mock assignmentRepo.createEntity to return a new assignment
     * 3. Verify the assignment is created successfully
     */
    it('should successfully create an assignment', async () => {
      classRepo.getEntityById.mockResolvedValue({ id: 1 } as ClassEntity);
      const mockAssignment = { id: 1, title: 'Test' };
      assignmentRepo.createEntity.mockResolvedValue(mockAssignment as any);

      const result = await service.createAssignment({
        title: 'Test',
        dueDate: new Date(Date.now() + 100000).toISOString(), // Future
        classId: 1,
      });

      expect(result.id).toEqual(mockAssignment.id);
      expect(assignmentRepo.createEntity).toHaveBeenCalled();
    });
  });

  describe('submitAssignment', () => {
    /*
     * Flow: Submit Assignment (Deadline passed)
     * 1. Mock assignmentRepo.getEntityById to return an assignment with a past dueDate
     * 2. Expect submitAssignment to throw httpBadRequest
     */
    it('should throw httpBadRequest if deadline passed', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 10);
      assignmentRepo.getEntityById.mockResolvedValue({
        id: 1,
        dueDate: pastDate,
      } as AssignmentEntity);

      await expect(
        service.submitAssignment(1, 1, { content: 'test' }),
      ).rejects.toThrow(httpBadRequest);
    });

    /*
     * Flow: Submit Assignment (New submission)
     * 1. Mock assignmentRepo.getEntityById with a future dueDate
     * 2. Mock submissionRepo.findOne to return null (no existing submission)
     * 3. Mock submissionRepo.createEntity to return a new submission
     * 4. Verify a new submission is created
     */
    it('should create new submission if not exists', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      assignmentRepo.getEntityById.mockResolvedValue({
        id: 1,
        dueDate: futureDate,
      } as AssignmentEntity);
      submissionRepo.findOne.mockResolvedValue(null);
      submissionRepo.createEntity.mockResolvedValue({
        id: 1,
        content: 'test',
      } as any);

      const result = await service.submitAssignment(1, 1, { content: 'test' });

      expect(result.id).toEqual(1);
      expect(submissionRepo.createEntity).toHaveBeenCalled();
    });

    /*
     * Flow: Submit Assignment (Resubmit)
     * 1. Mock assignmentRepo.getEntityById with a future dueDate
     * 2. Mock submissionRepo.findOne to return an existing submission
     * 3. Mock submissionRepo.updateEntity to update the submission
     * 4. Verify the existing submission is updated
     */
    it('should update existing submission if exists (resubmit)', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      assignmentRepo.getEntityById.mockResolvedValue({
        id: 1,
        dueDate: futureDate,
      } as AssignmentEntity);
      submissionRepo.findOne.mockResolvedValue({
        id: 1,
        content: 'old',
      } as any);
      submissionRepo.updateEntity.mockResolvedValue({
        id: 1,
        content: 'new test',
      } as any);

      const result = await service.submitAssignment(1, 1, {
        content: 'new test',
      });

      expect(result.id).toEqual(1);
      expect(submissionRepo.updateEntity).toHaveBeenCalled();
    });
  });

  describe('gradeSubmission', () => {
    /*
     * Flow: Grade Submission (Not found)
     * 1. Mock submissionRepo.getEntityById to return null
     * 2. Expect gradeSubmission to throw httpNotFound
     */
    it('should throw httpNotFound if submission not found', async () => {
      submissionRepo.getEntityById.mockResolvedValue(null);

      await expect(service.gradeSubmission(1, { score: 100 })).rejects.toThrow(
        httpNotFound,
      );
    });

    /*
     * Flow: Grade Submission Success
     * 1. Mock submissionRepo.getEntityById to return a valid submission
     * 2. Mock submissionRepo.updateEntity to update score and feedback
     * 3. Verify the submission is graded successfully
     */
    it('should grade submission successfully', async () => {
      submissionRepo.getEntityById.mockResolvedValue({
        id: 1,
      } as AssignmentSubmissionEntity);
      submissionRepo.updateEntity.mockResolvedValue({
        id: 1,
        score: 95,
      } as any);

      const result = await service.gradeSubmission(1, {
        score: 95,
        feedback: 'Good job',
      });

      expect(result.id).toEqual(1);
      expect(submissionRepo.updateEntity).toHaveBeenCalledWith(
        { id: 1 },
        expect.objectContaining({ score: 95, feedback: 'Good job' }),
      );
    });
  });
});
