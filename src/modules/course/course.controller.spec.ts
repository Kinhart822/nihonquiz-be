import { Test, TestingModule } from '@nestjs/testing';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

describe('CourseController', () => {
  let controller: CourseController;
  let service: jest.Mocked<CourseService>;

  beforeEach(async () => {
    const mockService = {
      createCourse: jest.fn(),
      getCourses: jest.fn(),
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        {
          provide: CourseService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CourseController>(CourseController);
    service = module.get(CourseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCourse', () => {
    it('should call createCourse on service', async () => {
      /*
       * Flow: Create Course
       * 1. Mock service.createCourse to return a new course object.
       * 2. Call controller.createCourse with creation DTO.
       * 3. Verify service method is called with correct parameters.
       */
      const mockResult = { id: 1 };
      service.createCourse.mockResolvedValue(mockResult as any);

      const dto = { title: 'New Course', description: 'Desc' };
      const result = await controller.createCourse(dto as any);
      expect(service.createCourse).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getCourses', () => {
    it('should call getCourses on service', async () => {
      /*
       * Flow: Get Paginated Courses
       * 1. Mock service.getCourses to return a paginated result.
       * 2. Call controller.getCourses with filter DTO.
       * 3. Verify service method is called with correct DTO.
       */
      const mockResult = { data: [], meta: {} };
      service.getCourses.mockResolvedValue(mockResult as any);

      const filter = { skip: 0, take: 10 };
      const result = await controller.getCourses(filter as any);
      expect(service.getCourses).toHaveBeenCalledWith(filter);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getCourseById', () => {
    it('should call getCourseById on service', async () => {
      /*
       * Flow: Get Course Info
       * 1. Mock service.getCourseById to return course details.
       * 2. Call controller.getCourseById with string ID.
       * 3. Verify service method is called with converted numeric ID.
       */
      const mockResult = { id: 1 };
      service.getCourseById.mockResolvedValue(mockResult as any);

      const result = await controller.getCourseById('1');
      expect(service.getCourseById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateCourse', () => {
    it('should call updateCourse on service', async () => {
      /*
       * Flow: Update Course
       * 1. Mock service.updateCourse to return updated course.
       * 2. Call controller.updateCourse with string ID and update DTO.
       * 3. Verify service method is called with numeric ID and correct DTO.
       */
      const mockResult = { id: 1 };
      service.updateCourse.mockResolvedValue(mockResult as any);

      const dto = { title: 'Updated' };
      const result = await controller.updateCourse('1', dto as any);
      expect(service.updateCourse).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteCourse', () => {
    it('should call deleteCourse on service', async () => {
      /*
       * Flow: Delete Course
       * 1. Mock service.deleteCourse to return undefined (success).
       * 2. Call controller.deleteCourse with string ID.
       * 3. Verify service method is called with numeric ID.
       */
      service.deleteCourse.mockResolvedValue(undefined);

      const result = await controller.deleteCourse('1');
      expect(service.deleteCourse).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});
