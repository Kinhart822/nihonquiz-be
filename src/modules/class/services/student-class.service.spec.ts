import { ClassAnnouncementRepository } from '../../../database/repository/class-announcement.repository';
import { ClassScheduleRepository } from '../../../database/repository/class-schedule.repository';
import { ClassStudentRepository } from '../../../database/repository/class-student.repository';
import { ClassRepository } from '../../../database/repository/class.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { httpBadRequest } from '../../../shared/exceptions/http-exception';
import { StudentClassService } from './student-class.service';
import { PageDto } from '../../../shared/dtos/page.dto';

describe('StudentClassService', () => {
  let service: StudentClassService;
  let classRepo: jest.Mocked<ClassRepository>;
  let classStudentRepo: jest.Mocked<ClassStudentRepository>;
  let announcementRepo: jest.Mocked<ClassAnnouncementRepository>;
  let scheduleRepo: jest.Mocked<ClassScheduleRepository>;

  beforeEach(async () => {
    const mockClassRepo = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
    };

    const mockClassStudentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      getMyClassesWithFilters: jest.fn(),
      getStudentsWithFilters: jest.fn(),
    };

    const mockAnnouncementRepo = {
      find: jest.fn(),
    };

    const mockScheduleRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentClassService,
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
        {
          provide: ClassScheduleRepository,
          useValue: mockScheduleRepo,
        },
      ],
    }).compile();

    service = module.get<StudentClassService>(StudentClassService);
    classRepo = module.get(ClassRepository);
    classStudentRepo = module.get(ClassStudentRepository);
    announcementRepo = module.get(ClassAnnouncementRepository);
    scheduleRepo = module.get(ClassScheduleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyClasses', () => {
    it('should return my classes', async () => {
      /*
       * Flow: Get My Classes
       * 1. Mock classStudentRepo to return paginated classes.
       * 2. Call service.getMyClasses with student ID and PageOptionsDto.
       * 3. Verify it maps correctly to a PageDto response.
       */
      classStudentRepo.getMyClassesWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      } as any);

      const result = await service.getMyClasses(1, {
        skip: 0,
        take: 10,
      } as any);
      expect(classStudentRepo.getMyClassesWithFilters).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PageDto);
    });
  });

  describe('getClassDetails', () => {
    it('should throw error if student not in class', async () => {
      /*
       * Flow: Get Class Details (Not In Class)
       * 1. Mock classStudentRepo to return null.
       * 2. Call service.getClassDetails.
       * 3. Verify Bad Request exception is thrown.
       */
      classStudentRepo.findOne.mockResolvedValue(null);
      await expect(service.getClassDetails(1, 999)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should return class details', async () => {
      /*
       * Flow: Get Class Details (Success)
       * 1. Mock classStudentRepo to return student's class relation.
       * 2. Call service.getClassDetails.
       * 3. Verify class details are returned.
       */
      classStudentRepo.findOne.mockResolvedValue({ class: { id: 1 } } as any);

      const result = await service.getClassDetails(1, 1);
      expect(classStudentRepo.findOne).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('joinClassByCode', () => {
    it('should throw error if class code invalid', async () => {
      /*
       * Flow: Join Class By Code (Invalid Code)
       * 1. Mock classRepo to return null for the provided code.
       * 2. Call service.joinClassByCode.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.joinClassByCode(1, { code: 'INVALID' }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should join class successfully', async () => {
      /*
       * Flow: Join Class By Code (Success)
       * 1. Mock classRepo to find the class by code.
       * 2. Mock classStudentRepo to create and save the relation.
       * 3. Call service.joinClassByCode.
       * 4. Verify student is saved to the class successfully.
       */
      classRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      classStudentRepo.create.mockReturnValue({} as any);
      classStudentRepo.save.mockResolvedValue({} as any);

      const result = await service.joinClassByCode(1, { code: 'VALID' });
      expect(classStudentRepo.save).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });
  });

  describe('leaveClass', () => {
    it('should throw error if not in class', async () => {
      /*
       * Flow: Leave Class (Not In Class)
       * 1. Mock classStudentRepo to return null for the given class and student.
       * 2. Call service.leaveClass.
       * 3. Verify Bad Request exception is thrown.
       */
      classStudentRepo.findOneBy.mockResolvedValue(null);
      await expect(service.leaveClass(1, 999)).rejects.toThrow(httpBadRequest);
    });

    it('should leave class', async () => {
      /*
       * Flow: Leave Class (Success)
       * 1. Mock classStudentRepo to find existing student in class.
       * 2. Mock removal operation.
       * 3. Call service.leaveClass.
       * 4. Verify the student relation is removed.
       */
      const student = { classId: 1, studentId: 1 };
      classStudentRepo.findOneBy.mockResolvedValue(student as any);
      classStudentRepo.remove.mockResolvedValue({} as any);

      const result = await service.leaveClass(1, 1);
      expect(classStudentRepo.remove).toHaveBeenCalledWith(student);
      expect(result.message).toBeDefined();
    });
  });

  describe('getClassMembers', () => {
    it('should throw error if class not found', async () => {
      /*
       * Flow: Get Class Members (Class Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.getClassMembers.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOne.mockResolvedValue(null);
      await expect(service.getClassMembers(1, 999, {} as any)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should throw error if not in class', async () => {
      /*
       * Flow: Get Class Members (Student Not In Class)
       * 1. Mock classRepo to return a valid class.
       * 2. Mock classStudentRepo to return null.
       * 3. Call service.getClassMembers.
       * 4. Verify Bad Request exception is thrown.
       */
      classRepo.findOne.mockResolvedValue({ id: 1 } as any);
      classStudentRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getClassMembers(1, 1, {} as any)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should get members', async () => {
      /*
       * Flow: Get Class Members (Success)
       * 1. Mock classRepo to return class details (with teacher).
       * 2. Mock classStudentRepo to verify student is in the class.
       * 3. Mock classStudentRepo to return paginated student list.
       * 4. Verify the response contains a PageDto of students.
       */
      classRepo.findOne.mockResolvedValue({ id: 1, teacher: { id: 2 } } as any);
      classStudentRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      classStudentRepo.getStudentsWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      } as any);

      const result = await service.getClassMembers(1, 1, {
        skip: 0,
        take: 10,
      } as any);
      expect(result.students).toBeInstanceOf(PageDto);
    });
  });

  describe('getAnnouncements', () => {
    it('should throw error if not in class', async () => {
      /*
       * Flow: Get Announcements (Not In Class)
       * 1. Mock classStudentRepo to return null.
       * 2. Call service.getAnnouncements.
       * 3. Verify Bad Request exception is thrown.
       */
      classStudentRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getAnnouncements(1, 999)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should return announcements', async () => {
      /*
       * Flow: Get Announcements (Success)
       * 1. Mock classStudentRepo to confirm student is in the class.
       * 2. Mock announcementRepo.find to return an array of announcements.
       * 3. Call service.getAnnouncements.
       * 4. Verify announcements are returned correctly.
       */
      classStudentRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      announcementRepo.find.mockResolvedValue([{ id: 1 }] as any);

      const result = await service.getAnnouncements(1, 1);
      expect(announcementRepo.find).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });
  });

  describe('getSchedules', () => {
    it('should throw error if not in class', async () => {
      /*
       * Flow: Get Schedules (Not In Class)
       * 1. Mock classStudentRepo to return null.
       * 2. Call service.getSchedules.
       * 3. Verify Bad Request exception is thrown.
       */
      classStudentRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getSchedules(1, 999)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should return schedules', async () => {
      /*
       * Flow: Get Schedules (Success)
       * 1. Mock classStudentRepo to confirm student is in the class.
       * 2. Mock scheduleRepo.find to return an array of schedules.
       * 3. Call service.getSchedules.
       * 4. Verify schedules are returned correctly.
       */
      classStudentRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      scheduleRepo.find.mockResolvedValue([{ id: 1 }] as any);

      const result = await service.getSchedules(1, 1);
      expect(scheduleRepo.find).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });
  });
});
