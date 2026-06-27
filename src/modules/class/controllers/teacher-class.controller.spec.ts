import { Test, TestingModule } from '@nestjs/testing';
import { TeacherClassController } from './teacher-class.controller';
import { TeacherClassService } from '../services/teacher-class.service';
import { ClassStudentStatus } from '../../../constants/class.constant';
import { PageDto } from '../../../shared/dtos/page.dto';

describe('TeacherClassController', () => {
  let controller: TeacherClassController;
  let service: jest.Mocked<TeacherClassService>;

  beforeEach(async () => {
    const mockService = {
      getMyTeachingClasses: jest.fn(),
      updateClass: jest.fn(),
      generateClassCode: jest.fn(),
      getClassMembers: jest.fn(),
      updateStudentStatus: jest.fn(),
      createAnnouncement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherClassController],
      providers: [
        {
          provide: TeacherClassService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TeacherClassController>(TeacherClassController);
    service = module.get(TeacherClassService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyTeachingClasses', () => {
    it('should return my teaching classes', async () => {
      /*
       * Flow: Get Teaching Classes
       * 1. Mock service.getMyTeachingClasses to return paginated result.
       * 2. Call controller.getMyTeachingClasses with user object and PageOptionsDto.
       * 3. Verify service is called with the user ID and query parameters.
       */
      const mockResult = { data: [], meta: {} };
      service.getMyTeachingClasses.mockResolvedValue(mockResult as any);

      const result = await controller.getMyTeachingClasses(
        { id: 1 } as any,
        { skip: 0, take: 10 } as any,
      );
      expect(service.getMyTeachingClasses).toHaveBeenCalledWith(1, {
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateClass', () => {
    it('should update class details', async () => {
      /*
       * Flow: Update Class Details
       * 1. Mock service.updateClass to return updated class.
       * 2. Call controller.updateClass with user object, class ID string, and DTO.
       * 3. Verify service is called with user ID, numeric class ID, and correct DTO.
       */
      const mockResult = { id: 1 };
      service.updateClass.mockResolvedValue(mockResult as any);

      const result = await controller.updateClass({ id: 1 } as any, '2', {
        name: 'New',
      } as any);
      expect(service.updateClass).toHaveBeenCalledWith(1, 2, { name: 'New' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('generateClassCode', () => {
    it('should generate code', async () => {
      /*
       * Flow: Generate Class Code
       * 1. Mock service.generateClassCode to return a new code.
       * 2. Call controller.generateClassCode with user object and class ID string.
       * 3. Verify service is called with numeric IDs.
       */
      const mockResult = { code: 'ABC' };
      service.generateClassCode.mockResolvedValue(mockResult as any);

      const result = await controller.generateClassCode({ id: 1 } as any, '2');
      expect(service.generateClassCode).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClassMembers', () => {
    it('should get class members', async () => {
      /*
       * Flow: Get Class Members
       * 1. Mock service.getClassMembers to return members.
       * 2. Call controller.getClassMembers with user object, class ID, and query parameters.
       * 3. Verify service is called with correct numeric IDs and query filters.
       */
      const mockResult = {
        teacher: null,
        students: new PageDto([], {} as any),
      };
      service.getClassMembers.mockResolvedValue(mockResult as any);

      const result = await controller.getClassMembers(
        '2',
        { id: 1 } as any,
        { skip: 0, take: 10 } as any,
      );
      expect(service.getClassMembers).toHaveBeenCalledWith(1, 2, {
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateStudentStatus', () => {
    it('should update student status', async () => {
      /*
       * Flow: Update Student Status
       * 1. Mock service.updateStudentStatus to return success message.
       * 2. Call controller.updateStudentStatus with user, class ID, student ID, and new status.
       * 3. Verify service is called with properly parsed numeric IDs and status.
       */
      const mockResult = { message: 'ok' };
      service.updateStudentStatus.mockResolvedValue(mockResult as any);

      const result = await controller.updateStudentStatus(
        { id: 1 } as any,
        '2',
        '3',
        ClassStudentStatus.ACTIVE,
      );
      expect(service.updateStudentStatus).toHaveBeenCalledWith(
        1,
        2,
        3,
        ClassStudentStatus.ACTIVE,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createAnnouncement', () => {
    it('should create announcement', async () => {
      /*
       * Flow: Create Announcement
       * 1. Mock service.createAnnouncement to return a new announcement.
       * 2. Call controller.createAnnouncement with user object, class ID, and DTO.
       * 3. Verify service is called with user ID, numeric class ID, and correct payload.
       */
      const mockResult = { id: 1 };
      service.createAnnouncement.mockResolvedValue(mockResult as any);

      const result = await controller.createAnnouncement(
        { id: 1 } as any,
        '2',
        { title: 'T' } as any,
      );
      expect(service.createAnnouncement).toHaveBeenCalledWith(1, 2, {
        title: 'T',
      });
      expect(result).toEqual(mockResult);
    });
  });
});
