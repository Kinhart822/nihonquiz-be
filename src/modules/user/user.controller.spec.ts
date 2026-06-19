import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockUserService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile from user service', async () => {
      const mockProfile = { id: 1, username: 'test' };
      userService.getProfile.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfile({ id: 1 } as JwtPayloadDto);

      expect(userService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should call updateProfile on service with correct params', async () => {
      const mockResult = { message: 'Success' };
      userService.updateProfile.mockResolvedValue(mockResult);

      const dto = { username: 'newname' };
      const files = {
        avatar: [{ originalname: 'avatar.png' }] as any,
        background: [{ originalname: 'bg.png' }] as any,
      };

      const result = await controller.updateProfile(
        { id: 1 } as JwtPayloadDto,
        dto,
        files,
      );

      expect(userService.updateProfile).toHaveBeenCalledWith(
        1,
        dto,
        files.avatar[0],
        files.background[0],
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle missing files', async () => {
      const mockResult = { message: 'Success' };
      userService.updateProfile.mockResolvedValue(mockResult);

      const dto = { username: 'newname' };

      const result = await controller.updateProfile(
        { id: 1 } as JwtPayloadDto,
        dto,
        {} as any,
      );

      expect(userService.updateProfile).toHaveBeenCalledWith(
        1,
        dto,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
