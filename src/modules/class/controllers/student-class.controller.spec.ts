import { Test, TestingModule } from '@nestjs/testing';
import { StudentClassController } from './student-class.controller';
import { StudentClassService } from '../services/student-class.service';
import { PageDto } from '../../../shared/dtos/page.dto';

describe('StudentClassController', () => {
  let controller: StudentClassController;
  let service: jest.Mocked<StudentClassService>;

  beforeEach(async () => {
    const mockService = {
      getMyClasses: jest.fn(),
      getClassDetails: jest.fn(),
      joinClassByCode: jest.fn(),
      leaveClass: jest.fn(),
      getClassMembers: jest.fn(),
      getAnnouncements: jest.fn(),
      getSchedules: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentClassController],
      providers: [
        {
          provide: StudentClassService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<StudentClassController>(StudentClassController);
    service = module.get(StudentClassService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyClasses', () => {
    it('should return my classes', async () => {
      /*
       * Flow: Get My Classes
       * 1. Mock service.getMyClasses to return paginated classes.
       * 2. Call controller.getMyClasses with user object and PageOptionsDto.
       * 3. Verify service is called with the student ID and query options.
       */
      const mockResult = { data: [], meta: {} };
      service.getMyClasses.mockResolvedValue(mockResult as any);

      const result = await controller.getMyClasses(
        { id: 1 } as any,
        { skip: 0, take: 10 } as any,
      );
      expect(service.getMyClasses).toHaveBeenCalledWith(1, {
        skip: 0,
        take: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClassDetails', () => {
    it('should get details', async () => {
      /*
       * Flow: Get Class Details
       * 1. Mock service.getClassDetails to return class details.
       * 2. Call controller.getClassDetails with class ID string and user object.
       * 3. Verify service is called with numeric IDs.
       */
      const mockResult = { id: 1 };
      service.getClassDetails.mockResolvedValue(mockResult as any);

      const result = await controller.getClassDetails('2', { id: 1 } as any);
      expect(service.getClassDetails).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('joinClassByCode', () => {
    it('should join class', async () => {
      /*
       * Flow: Join Class By Code
       * 1. Mock service.joinClassByCode to return success message.
       * 2. Call controller.joinClassByCode with user object and JoinClassDto.
       * 3. Verify service is called with student ID and DTO.
       */
      const mockResult = { message: 'ok' };
      service.joinClassByCode.mockResolvedValue(mockResult as any);

      const result = await controller.joinClassByCode({ id: 1 } as any, {
        code: '123',
      });
      expect(service.joinClassByCode).toHaveBeenCalledWith(1, { code: '123' });
      expect(result).toEqual(mockResult);
    });
  });

  describe('leaveClass', () => {
    it('should leave class', async () => {
      /*
       * Flow: Leave Class
       * 1. Mock service.leaveClass to return success message.
       * 2. Call controller.leaveClass with class ID string and user object.
       * 3. Verify service is called with numeric IDs.
       */
      const mockResult = { message: 'ok' };
      service.leaveClass.mockResolvedValue(mockResult as any);

      const result = await controller.leaveClass('2', { id: 1 } as any);
      expect(service.leaveClass).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClassMembers', () => {
    it('should get class members', async () => {
      /*
       * Flow: Get Class Members
       * 1. Mock service.getClassMembers to return paginated members.
       * 2. Call controller.getClassMembers with class ID string, user, and PageOptionsDto.
       * 3. Verify service is called with correct parameters.
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

  describe('getAnnouncements', () => {
    it('should return announcements', async () => {
      /*
       * Flow: Get Announcements
       * 1. Mock service.getAnnouncements to return list of announcements.
       * 2. Call controller.getAnnouncements with class ID string and user object.
       * 3. Verify service is called with numeric IDs.
       */
      const mockResult = [{ id: 1 }];
      service.getAnnouncements.mockResolvedValue(mockResult as any);

      const result = await controller.getAnnouncements('2', { id: 1 } as any);
      expect(service.getAnnouncements).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getSchedules', () => {
    it('should return schedules', async () => {
      /*
       * Flow: Get Schedules
       * 1. Mock service.getSchedules to return list of schedules.
       * 2. Call controller.getSchedules with class ID string and user object.
       * 3. Verify service is called with numeric IDs.
       */
      const mockResult = [{ id: 1 }];
      service.getSchedules.mockResolvedValue(mockResult as any);

      const result = await controller.getSchedules('2', { id: 1 } as any);
      expect(service.getSchedules).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockResult);
    });
  });
});
