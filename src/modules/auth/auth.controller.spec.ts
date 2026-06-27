import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IMailType } from '../../constants/mail.constant';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockService = {
      register: jest.fn(),
      signIn: jest.fn(),
      logout: jest.fn(),
      verifyOtpAndExecuteAction: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      resendCode: jest.fn(),
      refreshToken: jest.fn(),
      googleLogin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUser', () => {
    it('should call register', async () => {
      /*
       * Flow: Register User
       * 1. Mock service.register to return a success message.
       * 2. Call controller.registerUser with user data.
       * 3. Verify service.register is called with correct DTO.
       * 4. Verify result matches expected output.
       */
      const mockResult = { message: 'ok' };
      service.register.mockResolvedValue(mockResult as any);

      const dto = { email: 'test@ex.com', username: 'test', password: 'pw' };
      const result = await controller.registerUser(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('login', () => {
    it('should call signIn', async () => {
      /*
       * Flow: Login
       * 1. Mock service.signIn to return tokens.
       * 2. Call controller.login with credentials.
       * 3. Verify service.signIn is called with correct DTO.
       */
      const mockResult = { accessToken: 'token' };
      service.signIn.mockResolvedValue(mockResult as any);

      const dto = { email: 'test@ex.com', password: 'pw' };
      const result = await controller.login(dto);
      expect(service.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('logout', () => {
    it('should call logout', async () => {
      /*
       * Flow: Logout
       * 1. Mock service.logout to return success.
       * 2. Call controller.logout with authenticated user ID.
       * 3. Verify service.logout is called with correct ID.
       */
      const mockResult = { message: 'ok' };
      service.logout.mockResolvedValue(mockResult as any);

      const result = await controller.logout({ id: 1 } as any);
      expect(service.logout).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('verifyOtp', () => {
    it('should call verifyOtpAndExecuteAction', async () => {
      /*
       * Flow: Verify OTP
       * 1. Mock service.verifyOtpAndExecuteAction to return success.
       * 2. Call controller.verifyOtp with email, code, and type.
       * 3. Verify service method is called with correct parameters.
       */
      const mockResult = { message: 'ok' };
      service.verifyOtpAndExecuteAction.mockResolvedValue(mockResult as any);

      const dto = {
        email: 'test@ex.com',
        code: '123',
        type: IMailType.SIGN_UP,
      };
      const result = await controller.verifyOtp(dto);
      expect(service.verifyOtpAndExecuteAction).toHaveBeenCalledWith(
        dto.email,
        dto.code,
        dto.type,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('forgotPassword', () => {
    it('should call forgotPassword', async () => {
      /*
       * Flow: Forgot Password
       * 1. Mock service.forgotPassword to return success.
       * 2. Call controller.forgotPassword with email.
       * 3. Verify service is called to generate and send OTP.
       */
      const mockResult = { message: 'ok' };
      service.forgotPassword.mockResolvedValue(mockResult as any);

      const dto = { email: 'test@ex.com' };
      const result = await controller.forgotPassword(dto);
      expect(service.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('resetPassword', () => {
    it('should call resetPassword', async () => {
      /*
       * Flow: Reset Password
       * 1. Mock service.resetPassword to return success.
       * 2. Call controller.resetPassword with email, OTP, and new password.
       * 3. Verify service is called with correct DTO.
       */
      const mockResult = { message: 'ok' };
      service.resetPassword.mockResolvedValue(mockResult as any);

      const dto = { email: 'test@ex.com', code: '123', password: 'new' };
      const result = await controller.resetPassword(dto);
      expect(service.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('resendCode', () => {
    it('should call resendCode', async () => {
      /*
       * Flow: Resend Code
       * 1. Mock service.resendCode to return success.
       * 2. Call controller.resendCode with email and mail type.
       * 3. Verify service is called to resend OTP.
       */
      const mockResult = { message: 'ok' };
      service.resendCode.mockResolvedValue(mockResult as any);

      const dto = { email: 'test@ex.com', type: IMailType.SIGN_UP };
      const result = await controller.resendCode(dto);
      expect(service.resendCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('refreshToken', () => {
    it('should call refreshToken', async () => {
      /*
       * Flow: Refresh Token
       * 1. Mock service.refreshToken to return new tokens.
       * 2. Call controller.refreshToken with old refresh token.
       * 3. Verify service is called with correct DTO.
       */
      const mockResult = { accessToken: 'token', refreshToken: 'token' };
      service.refreshToken.mockResolvedValue(mockResult as any);

      const dto = { refreshToken: 'token' };
      const result = await controller.refreshToken(dto);
      expect(service.refreshToken).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('googleAuthRedirect', () => {
    it('should call googleLogin', async () => {
      /*
       * Flow: Google Auth Redirect
       * 1. Mock service.googleLogin to return tokens.
       * 2. Call controller.googleAuthRedirect with request containing Google user profile.
       * 3. Verify service is called to authenticate or register user.
       */
      const mockResult = { accessToken: 'token' };
      service.googleLogin.mockResolvedValue(mockResult as any);

      const req = { user: {} };
      const result = await controller.googleAuthRedirect(req);
      expect(service.googleLogin).toHaveBeenCalledWith(req);
      expect(result).toEqual(mockResult);
    });
  });
});
