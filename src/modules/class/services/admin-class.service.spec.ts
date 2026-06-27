import { ClassAnnouncementRepository } from '../../../database/repository/class-announcement.repository';
import { ClassStudentRepository } from '../../../database/repository/class-student.repository';
import { ClassRepository } from '../../../database/repository/class.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { httpBadRequest } from '../../../shared/exceptions/http-exception';
import { AdminClassService } from './admin-class.service';
import { PageDto } from '../../../shared/dtos/page.dto';

describe('AdminClassService', () => {
  let service: AdminClassService;
  let classRepo: jest.Mocked<ClassRepository>;
  let classStudentRepo: jest.Mocked<ClassStudentRepository>;
  let announcementRepo: jest.Mocked<ClassAnnouncementRepository>;

  beforeEach(async () => {
    const mockClassRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      getClassesWithFilters: jest.fn(),
      softRemove: jest.fn(),
    };

    const mockClassStudentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
      getStudentsWithFilters: jest.fn(),
    };

    const mockAnnouncementRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminClassService,
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

    service = module.get<AdminClassService>(AdminClassService);
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

  describe('createClass', () => {
    it('should create and return a class', async () => {
      /*
       * Flow: Create Class
       * 1. Create a class entity via repository using provided DTO.
       * 2. Mock save method to return the newly created entity.
       * 3. Call service.createClass.
       * 4. Verify repository methods are called with correct data.
       */
      const dto = { name: 'Class 1', courseId: 1 };
      const newClass = { id: 1, ...dto };
      classRepo.create.mockReturnValue(newClass as any);
      classRepo.save.mockResolvedValue(newClass as any);

      const result = await service.createClass(dto as any);
      expect(classRepo.create).toHaveBeenCalledWith(dto);
      expect(classRepo.save).toHaveBeenCalledWith(newClass);
      expect(result.id).toBe(1);
    });
  });

  describe('updateClass', () => {
    it('should throw bad request if class not found', async () => {
      /*
       * Flow: Update Class (Not Found)
       * 1. Mock repository to return null for the class ID.
       * 2. Call service.updateClass.
       * 3. Verify it throws a Bad Request exception.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateClass(999, {})).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should update and return class', async () => {
      /*
       * Flow: Update Class (Success)
       * 1. Mock repository to return an existing class.
       * 2. Mock save method to return updated class.
       * 3. Call service.updateClass with DTO.
       * 4. Verify class is saved with new values.
       */
      const classEntity = { id: 1, name: 'Old' };
      classRepo.findOneBy.mockResolvedValue(classEntity as any);
      classRepo.save.mockResolvedValue({ id: 1, name: 'New' } as any);

      const result = await service.updateClass(1, { name: 'New' });
      expect(classRepo.save).toHaveBeenCalledWith({ id: 1, name: 'New' });
      expect(result).toBeDefined();
    });
  });

  describe('assignTeacher', () => {
    it('should throw error if class not found', async () => {
      /*
       * Flow: Assign Teacher (Class Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.assignTeacher.
       * 3. Verify it throws a Bad Request exception.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.assignTeacher(999, { teacherId: 2 } as any),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should assign teacher and save', async () => {
      /*
       * Flow: Assign Teacher (Success)
       * 1. Mock classRepo to return a class.
       * 2. Call service.assignTeacher with teacher ID DTO.
       * 3. Verify class is saved with the new teacherId.
       */
      const classEntity = { id: 1 };
      classRepo.findOneBy.mockResolvedValue(classEntity as any);
      classRepo.save.mockResolvedValue({ id: 1, teacherId: 2 } as any);

      const result = await service.assignTeacher(1, { teacherId: 2 } as any);
      expect(classRepo.save).toHaveBeenCalledWith({ id: 1, teacherId: 2 });
      expect(result).toBeDefined();
    });
  });

  describe('enrollStudent', () => {
    it('should throw error if class not found', async () => {
      /*
       * Flow: Enroll Student (Class Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.enrollStudent.
       * 3. Verify it throws a Bad Request exception.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.enrollStudent(999, { studentId: 1 } as any),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should enroll student successfully', async () => {
      /*
       * Flow: Enroll Student (Success)
       * 1. Mock classRepo to return a valid class.
       * 2. Mock classStudentRepo to create and save the relation.
       * 3. Call service.enrollStudent.
       * 4. Verify the student is saved to the class successfully.
       */
      classRepo.findOneBy.mockResolvedValue({ id: 1 } as any);
      classStudentRepo.create.mockReturnValue({
        classId: 1,
        studentId: 2,
      } as any);
      classStudentRepo.save.mockResolvedValue({} as any);

      const result = await service.enrollStudent(1, { studentId: 2 } as any);
      expect(classStudentRepo.save).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });
  });

  describe('removeStudent', () => {
    it('should throw error if student not in class', async () => {
      /*
       * Flow: Remove Student (Not Found)
       * 1. Mock classStudentRepo to return null for the given class and student.
       * 2. Call service.removeStudent.
       * 3. Verify Bad Request exception is thrown.
       */
      classStudentRepo.findOneBy.mockResolvedValue(null);
      await expect(service.removeStudent(1, 2)).rejects.toThrow(httpBadRequest);
    });

    it('should remove student successfully', async () => {
      /*
       * Flow: Remove Student (Success)
       * 1. Mock classStudentRepo to find the existing student in class.
       * 2. Mock removal operation.
       * 3. Call service.removeStudent.
       * 4. Verify the removal operation is performed.
       */
      const student = { classId: 1, studentId: 2 };
      classStudentRepo.findOneBy.mockResolvedValue(student as any);
      classStudentRepo.remove.mockResolvedValue({} as any);

      const result = await service.removeStudent(1, 2);
      expect(classStudentRepo.remove).toHaveBeenCalledWith(student);
      expect(result.message).toBeDefined();
    });
  });

  describe('getAllClasses', () => {
    it('should return paginated classes', async () => {
      /*
       * Flow: Get All Classes
       * 1. Mock classRepo to return a paginated result.
       * 2. Call service.getAllClasses with a PageOptionsDto.
       * 3. Verify it maps correctly to a PageDto response.
       */
      classRepo.getClassesWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      } as any);

      const result = await service.getAllClasses({ skip: 0, take: 10 } as any);
      expect(classRepo.getClassesWithFilters).toHaveBeenCalled();
      expect(result).toBeInstanceOf(PageDto);
    });
  });

  describe('deleteClass', () => {
    it('should throw error if not found', async () => {
      /*
       * Flow: Delete Class (Not Found)
       * 1. Mock classRepo to return null.
       * 2. Call service.deleteClass.
       * 3. Verify Bad Request exception is thrown.
       */
      classRepo.findOneBy.mockResolvedValue(null);
      await expect(service.deleteClass(999)).rejects.toThrow(httpBadRequest);
    });

    it('should soft remove class', async () => {
      /*
       * Flow: Delete Class (Success)
       * 1. Mock classRepo to find a valid class.
       * 2. Call service.deleteClass.
       * 3. Verify softRemove is called on the class entity.
       */
      const entity = { id: 1 };
      classRepo.findOneBy.mockResolvedValue(entity as any);
      classRepo.softRemove.mockResolvedValue({} as any);

      const result = await service.deleteClass(1);
      expect(classRepo.softRemove).toHaveBeenCalledWith(entity);
      expect(result.message).toBeDefined();
    });
  });

  describe('updateClassStatus', () => {
    it('should update status', async () => {
      /*
       * Flow: Update Class Status
       * 1. Mock classRepo to find a valid class.
       * 2. Call service.updateClassStatus with a boolean value.
       * 3. Verify class is saved with the new isActive status.
       */
      const entity = { id: 1, isActive: true };
      classRepo.findOneBy.mockResolvedValue(entity as any);
      classRepo.save.mockResolvedValue({} as any);

      const result = await service.updateClassStatus(1, false);
      expect(classRepo.save).toHaveBeenCalledWith({ id: 1, isActive: false });
      expect(result.message).toBeDefined();
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
      await expect(service.getClassMembers(999, {} as any)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should return members list', async () => {
      /*
       * Flow: Get Class Members (Success)
       * 1. Mock classRepo to return a class with a teacher.
       * 2. Mock classStudentRepo to return paginated students.
       * 3. Call service.getClassMembers.
       * 4. Verify the response contains teacher data and a PageDto of students.
       */
      classRepo.findOne.mockResolvedValue({ id: 1, teacher: { id: 2 } } as any);
      classStudentRepo.getStudentsWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      } as any);

      const result = await service.getClassMembers(1, {
        skip: 0,
        take: 10,
      } as any);
      expect(result.teacher).toBeDefined();
      expect(result.students).toBeInstanceOf(PageDto);
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement', async () => {
      /*
       * Flow: Create Class Announcement
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
