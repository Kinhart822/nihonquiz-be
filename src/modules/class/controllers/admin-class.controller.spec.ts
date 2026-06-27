import { Test, TestingModule } from '@nestjs/testing';
import { AdminClassController } from './admin-class.controller';
import { AdminClassService } from '../services/admin-class.service';
import { PageDto } from '../../../shared/dtos/page.dto';

describe('AdminClassController', () => {
  let controller: AdminClassController;
  let service: jest.Mocked<AdminClassService>;

  beforeEach(async () => {
    const mockService = {
      getAllClasses: jest.fn(),
      createClass: jest.fn(),
      updateClass: jest.fn(),
      assignTeacher: jest.fn(),
      enrollStudent: jest.fn(),
      removeStudent: jest.fn(),
      deleteClass: jest.fn(),
      updateClassStatus: jest.fn(),
      getClassMembers: jest.fn(),
      createAnnouncement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminClassController],
      providers: [
        {
          provide: AdminClassService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminClassController>(AdminClassController);
    service = module.get(AdminClassService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllClasses', () => {
    it('should return all classes', async () => {
      /*
       * Flow: Get All Classes
       * 1. Mock service.getAllClasses to return a paginated response.
       * 2. Call controller.getAllClasses with PageOptionsDto.
       * 3. Verify service is called with the correct DTO.
       */
      const mockResult = { data: [], meta: {} };
      service.getAllClasses.mockResolvedValue(mockResult as any);

      const result = await controller.getAllClasses({
        skip: 0,
        take: 10,
      } as any);
      expect(service.getAllClasses).toHaveBeenCalledWith({ skip: 0, take: 10 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('createClass', () => {
    it('should create class', async () => {
      /*
       * Flow: Create Class
       * 1. Mock service.createClass to return new class info.
       * 2. Call controller.createClass with a CreateClassDto.
       * 3. Verify service is called with the correct DTO.
       */
      const mockResult = { id: 1 };
      service.createClass.mockResolvedValue(mockResult as any);

      const result = await controller.createClass({ name: 'Class' } as any);
      expect(service.createClass).toHaveBeenCalledWith({ name: 'Class' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateClass', () => {
    it('should update class', async () => {
      /*
       * Flow: Update Class
       * 1. Mock service.updateClass to return updated class.
       * 2. Call controller.updateClass with string ID and UpdateClassDto.
       * 3. Verify service is called with numeric ID and DTO.
       */
      const mockResult = { id: 1 };
      service.updateClass.mockResolvedValue(mockResult as any);

      const result = await controller.updateClass('1', { name: 'New' } as any);
      expect(service.updateClass).toHaveBeenCalledWith(1, { name: 'New' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('assignTeacher', () => {
    it('should assign teacher', async () => {
      /*
       * Flow: Assign Teacher
       * 1. Mock service.assignTeacher to return updated class.
       * 2. Call controller.assignTeacher with class ID and AssignTeacherDto.
       * 3. Verify service is called with parsed numeric ID and DTO.
       */
      const mockResult = { id: 1, teacherId: 2 };
      service.assignTeacher.mockResolvedValue(mockResult as any);

      const result = await controller.assignTeacher('1', {
        teacherId: 2,
      } as any);
      expect(service.assignTeacher).toHaveBeenCalledWith(1, { teacherId: 2 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('enrollStudent', () => {
    it('should enroll student', async () => {
      /*
       * Flow: Enroll Student
       * 1. Mock service.enrollStudent to return success message.
       * 2. Call controller.enrollStudent with class ID and EnrollStudentDto.
       * 3. Verify service is called with numeric ID and DTO.
       */
      const mockResult = { message: 'ok' };
      service.enrollStudent.mockResolvedValue(mockResult as any);

      const result = await controller.enrollStudent('1', {
        studentId: 2,
      } as any);
      expect(service.enrollStudent).toHaveBeenCalledWith(1, { studentId: 2 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('removeStudent', () => {
    it('should remove student', async () => {
      /*
       * Flow: Remove Student
       * 1. Mock service.removeStudent to return success message.
       * 2. Call controller.removeStudent with class ID and student ID strings.
       * 3. Verify service is called with numeric IDs.
       */
      const mockResult = { message: 'ok' };
      service.removeStudent.mockResolvedValue(mockResult as any);

      const result = await controller.removeStudent('1', '2');
      expect(service.removeStudent).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteClass', () => {
    it('should delete class', async () => {
      /*
       * Flow: Delete Class
       * 1. Mock service.deleteClass to return success message.
       * 2. Call controller.deleteClass with string ID.
       * 3. Verify service is called with numeric ID.
       */
      const mockResult = { message: 'ok' };
      service.deleteClass.mockResolvedValue(mockResult as any);

      const result = await controller.deleteClass('1');
      expect(service.deleteClass).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateClassStatus', () => {
    it('should update status', async () => {
      /*
       * Flow: Update Class Status
       * 1. Mock service.updateClassStatus to return success message.
       * 2. Call controller.updateClassStatus with string ID and boolean status.
       * 3. Verify service is called with correct parameters.
       */
      const mockResult = { message: 'ok' };
      service.updateClassStatus.mockResolvedValue(mockResult as any);

      const result = await controller.updateClassStatus('1', false);
      expect(service.updateClassStatus).toHaveBeenCalledWith(1, false);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClassMembers', () => {
    it('should get members', async () => {
      /*
       * Flow: Get Class Members
       * 1. Mock service.getClassMembers to return teacher and students.
       * 2. Call controller.getClassMembers with class ID and query filters.
       * 3. Verify service is called with numeric ID and filters.
       */
      const mockResult = {
        teacher: null,
        students: new PageDto([], {} as any),
      };
      service.getClassMembers.mockResolvedValue(mockResult as any);

      const result = await controller.getClassMembers('1', {
        skip: 0,
        take: 10,
      } as any);
      expect(service.getClassMembers).toHaveBeenCalledWith(1, {
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement', async () => {
      /*
       * Flow: Create Announcement
       * 1. Mock service.createAnnouncement to return new announcement.
       * 2. Call controller.createAnnouncement with user ID from request, class ID, and DTO.
       * 3. Verify service is called correctly.
       */
      const mockResult = { id: 1 };
      service.createAnnouncement.mockResolvedValue(mockResult as any);

      const result = await controller.createAnnouncement(
        '1',
        { id: 2 } as any,
        { title: 'Test' } as any,
      );
      expect(service.createAnnouncement).toHaveBeenCalledWith(2, 1, {
        title: 'Test',
      });
      expect(result).toEqual(mockResult);
    });
  });
});
