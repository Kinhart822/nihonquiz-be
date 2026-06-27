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
      changePassword: jest.fn(),
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
      /*
       * Flow: Get Profile
       * 1. Mock userService.getProfile to return a user profile.
       * 2. Call controller.getProfile with authenticated user ID.
       * 3. Verify service method is called with correct ID and returns expected result.
       */
      const mockProfile = { id: 1, username: 'test' };
      userService.getProfile.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfile({ id: 1 } as JwtPayloadDto);

      expect(userService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should call updateProfile on service with correct params', async () => {
      /*
       * Flow: Update Profile (With Files)
       * 1. Mock userService.updateProfile to return success message.
       * 2. Call controller.updateProfile with DTO and uploaded files (avatar/background).
       * 3. Verify service method is called with parsed file objects.
       */
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
      /*
       * Flow: Update Profile (Without Files)
       * 1. Mock userService.updateProfile to return success message.
       * 2. Call controller.updateProfile with DTO and empty files object.
       * 3. Verify service method is called with undefined for file arguments.
       */
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

  describe('changePassword', () => {
    it('should call changePassword on service with correct params', async () => {
      /*
       * Flow: Change Password
       * 1. Mock userService.changePassword to return success message.
       * 2. Call controller.changePassword with old and new password DTO.
       * 3. Verify service method is called with correct user ID and DTO.
       */
      const mockResult = { message: 'Success' };
      userService.changePassword.mockResolvedValue(mockResult);

      const dto = { oldPassword: 'old', newPassword: 'new' };

      const result = await controller.changePassword(
        { id: 1 } as JwtPayloadDto,
        dto,
      );

      expect(userService.changePassword).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
    });
  });
});
