import { ClassAnnouncementRepository } from '../../../database/repository/class-announcement.repository';
import { ClassStudentRepository } from '../../../database/repository/class-student.repository';
import { ClassRepository } from '../../../database/repository/class.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { httpBadRequest } from '../../../shared/exceptions/http-exception';
import { TeacherClassService } from './teacher-class.service';
import { PageDto } from '../../../shared/dtos/page.dto';
import { ClassStudentStatus } from '../../../constants/class.constant';

describe('TeacherClassService', () => {
  let service: TeacherClassService;
  let classRepo: jest.Mocked<ClassRepository>;
  let classStudentRepo: jest.Mocked<ClassStudentRepository>;
  let announcementRepo: jest.Mocked<ClassAnnouncementRepository>;

  beforeEach(async () => {
    const mockClassRepo = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      getClassesWithFilters: jest.fn(),
    };

    const mockClassStudentRepo = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      getStudentsWithFilters: jest.fn(),
    };

    const mockAnnouncementRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherClassService,
        {
          provide: ClassRepository,
          useValue: mockClassRepo,
        },
        {
          provide: ClassStudentRepository,
          useValue: mockClassStudentRepo,
        },
        {
          provide: ClassAnnouncementRepository,
          useValue: mockAnnouncementRepo,
        },
      ],
    }).compile();

    service = module.get<TeacherClassService>(TeacherClassService);
    classRepo = module.get(ClassRepository);
    classStudentRepo = module.get(ClassStudentRepository);
    announcementRepo = module.get(ClassAnnouncementRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyTeachingClasses', () => {
    it('should return paginated classes', async () => {
      /*
       * Flow: Get Teacher Classes
       * 1. Mock classRepo.getClassesWithFilters to return paginated response.
       * 2. Call service.getMyTeachingClasses.
       * 3. Verify it maps correctly to a PageDto.
       */
      classRepo.getClassesWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      } as any);

      const result = await service.getMyTeachingClasses(1, {
        skip: 0,
        take: 10,
      } as any);
      expect(classRepo.getClassesWithFilters).toHaveBeenCalledWith(1, {
        skip: 0,
        take: 10,
      });
      expect(result).toBeInstanceOf(PageDto);
    });
  });

  describe('updateClass', () => {
    it('should throw bad request if class not found', async () => {
      /*
       * Flow: Update Class (Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.updateClass.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateClass(1, 999, {})).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should update and return class', async () => {
      /*
       * Flow: Update Class (Success)
       * 1. Mock classRepo to return existing class.
       * 2. Mock save to return updated class.
       * 3. Call service.updateClass with DTO.
       * 4. Verify class is saved with new values.
       */
      const classEntity = { id: 1, name: 'Old' };
      classRepo.findOneBy.mockResolvedValue(classEntity as any);
      classRepo.save.mockResolvedValue({ id: 1, name: 'New' } as any);

      const result = await service.updateClass(1, 1, { name: 'New' });
      expect(classRepo.save).toHaveBeenCalledWith({ id: 1, name: 'New' });
      expect(result).toBeDefined();
    });
  });

  describe('generateClassCode', () => {
    it('should throw error if class not found', async () => {
      /*
       * Flow: Generate Class Code (Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.generateClassCode.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(service.generateClassCode(1, 999)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should generate code and save', async () => {
      /*
       * Flow: Generate Class Code (Success)
       * 1. Mock classRepo to find a valid class.
       * 2. Call service.generateClassCode.
       * 3. Verify a string code is generated and saved to the class.
       */
      const classEntity = { id: 1, code: '' };
      classRepo.findOneBy.mockResolvedValue(classEntity as any);
      classRepo.save.mockResolvedValue({} as any);

      const result = await service.generateClassCode(1, 1);
      expect(classRepo.save).toHaveBeenCalled();
      expect(result.code).toBeDefined();
      expect(typeof result.code).toBe('string');
    });
  });

  describe('getClassMembers', () => {
    it('should throw if class not found', async () => {
      /*
       * Flow: Get Class Members (Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.getClassMembers.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOne.mockResolvedValue(null);
      await expect(service.getClassMembers(1, 999, {} as any)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should return members list', async () => {
      /*
       * Flow: Get Class Members (Success)
       * 1. Mock classRepo to return a class with a teacher.
       * 2. Mock classStudentRepo to return paginated students.
       * 3. Call service.getClassMembers.
       * 4. Verify the response contains teacher and students.
       */
      classRepo.findOne.mockResolvedValue({ id: 1, teacher: { id: 1 } } as any);
      classStudentRepo.getStudentsWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      } as any);

      const result = await service.getClassMembers(1, 1, {
        skip: 0,
        take: 10,
      } as any);
      expect(result.teacher).toBeDefined();
      expect(result.students).toBeInstanceOf(PageDto);
    });
  });

  describe('updateStudentStatus', () => {
    it('should throw error if class not found', async () => {
      /*
       * Flow: Update Student Status (Class Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.updateStudentStatus.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.updateStudentStatus(1, 999, 1, ClassStudentStatus.ACTIVE),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should throw error if student not in class', async () => {
      /*
       * Flow: Update Student Status (Student Not Found)
       * 1. Mock classRepo to return a valid class.
       * 2. Mock classStudentRepo to return null for the student.
       * 3. Call service.updateStudentStatus.
       * 4. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      classStudentRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.updateStudentStatus(1, 1, 999, ClassStudentStatus.ACTIVE),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should update student status successfully', async () => {
      /*
       * Flow: Update Student Status (Success)
       * 1. Mock classRepo to find a valid class.
       * 2. Mock classStudentRepo to find the student in class.
       * 3. Call service.updateStudentStatus.
       * 4. Verify student is saved with the new status.
       */
      classRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      const student = {
        classId: 1,
        studentId: 2,
        status: ClassStudentStatus.PENDING,
      };
      classStudentRepo.findOneBy.mockResolvedValue(student as any);
      classStudentRepo.save.mockResolvedValue({} as any);

      const result = await service.updateStudentStatus(
        1,
        1,
        2,
        ClassStudentStatus.ACTIVE,
      );
      expect(classStudentRepo.save).toHaveBeenCalledWith({
        ...student,
        status: ClassStudentStatus.ACTIVE,
      });
      expect(result.message).toBeDefined();
    });
  });

  describe('createAnnouncement', () => {
    it('should throw error if class not found', async () => {
      /*
       * Flow: Create Announcement (Class Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.createAnnouncement.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.createAnnouncement(1, 999, {} as any),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should create announcement', async () => {
      /*
       * Flow: Create Announcement (Success)
       * 1. Mock classRepo to verify class exists.
       * 2. Mock announcementRepo to create and save the announcement.
       * 3. Call service.createAnnouncement.
       * 4. Verify announcement is saved correctly.
       */
      classRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      const dto = { title: 'Test', content: 'Test content' };
      const ann = { id: 1, ...dto };
      announcementRepo.create.mockReturnValue(ann as any);
      announcementRepo.save.mockResolvedValue(ann as any);

      const result = await service.createAnnouncement(1, 1, dto as any);
      expect(announcementRepo.save).toHaveBeenCalledWith(ann);
      expect(result).toBeDefined();
    });
  });
});
