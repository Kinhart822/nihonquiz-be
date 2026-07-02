import { Test, TestingModule } from '@nestjs/testing';
import { RoleUser } from '../../constants/user.constant';
import { ClassAnnouncementRepository } from '../../database/repository/class-announcement.repository';
import { ClassScheduleRepository } from '../../database/repository/class-schedule.repository';
import { ClassStudentRepository } from '../../database/repository/class-student.repository';
import { ClassRepository } from '../../database/repository/class.repository';
import { httpBadRequest } from '../../shared/exceptions/http-exception';
import { NotificationService } from '../notification/notification.service';
import { ClassService } from './class.service';

describe('ClassService', () => {
  let service: ClassService;
  let classRepo: jest.Mocked<ClassRepository>;
  let classStudentRepo: jest.Mocked<ClassStudentRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: ClassRepository,
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            getClassesWithFilters: jest.fn(),
            softRemove: jest.fn(),
          },
        },
        {
          provide: ClassStudentRepository,
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            getMyClassesWithFilters: jest.fn(),
          },
        },
        {
          provide: ClassAnnouncementRepository,
          useValue: {},
        },
        {
          provide: ClassScheduleRepository,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
    classRepo = module.get(ClassRepository);
    classStudentRepo = module.get(ClassStudentRepository);
  });

  describe('getClassDetails', () => {
    it('should return class details for Admin', async () => {
      /*
       * Flow: Get Class Details (Admin)
       * 1. Mock classRepo.findOne to return a valid class
       * 2. Expect class to be returned for Admin
       */
      const mockClass = { id: 1, name: 'Test Class', teacherId: 2 };
      classRepo.findOne.mockResolvedValue(mockClass as any);

      const result = await service.getClassDetails(
        { id: 1, role: RoleUser.ADMIN, email: 'admin@test.com' },
        1,
      );
      expect(result.id).toEqual(1);
      expect(result.name).toEqual('Test Class');
    });

    it('should throw error for Teacher if they do not own the class', async () => {
      /*
       * Flow: Get Class Details (Teacher Not Owner)
       * 1. Mock classRepo.findOne to return a valid class owned by another teacher
       * 2. Expect httpBadRequest (Unauthorized Access)
       */
      const mockClass = { id: 1, name: 'Test Class', teacherId: 3 };
      classRepo.findOne.mockResolvedValue(mockClass as any);

      await expect(
        service.getClassDetails(
          { id: 2, role: RoleUser.TEACHER, email: 'teacher@test.com' },
          1,
        ),
      ).rejects.toThrow(httpBadRequest);
    });
  });

  describe('createClass', () => {
    it('should successfully create a new class', async () => {
      /*
       * Flow: Create Class
       * 1. Mock classRepo.create and classRepo.save
       * 2. Verify class is saved and returned
       */
      const dto = { name: 'New Class', courseId: 1 };
      const mockSaved = { id: 1, name: 'New Class', courseId: 1 };
      classRepo.create.mockReturnValue(mockSaved as any);
      classRepo.save.mockResolvedValue(mockSaved as any);

      const result = await service.createClass(dto as any);
      expect(result.id).toEqual(1);
      expect(classRepo.create).toHaveBeenCalledWith(dto);
      expect(classRepo.save).toHaveBeenCalled();
    });
  });
});
