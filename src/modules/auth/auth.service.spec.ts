import { EnvKey } from '@constants/env.constant';
import { IMailType } from '@constants/mail.constant';
import { AccessMethod, UserStatus } from '@constants/user.constant';
import { UserRepository } from '@database/repository/user.repository';
import { MailService } from '@modules/mail/mail.service';
import { RedisService } from '@modules/redis/redis.service';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { httpErrors } from '@shared/exceptions/http-exception';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;
  let redisService: jest.Mocked<RedisService>;

  const mockUserRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  const mockMailService = {
    isOTPExist: jest.fn(),
    generateAndSendOTP: jest.fn(),
    verifyOTP: jest.fn(),
    clearOTP: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(UserRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    mailService = module.get(MailService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    it('should throw error if email already exists', async () => {
      /*
       * Flow: Register - Email Exists
       * 1. Query database for existing email.
       * 2. If email exists, throw ACCOUNT_EXISTED error.
       */
      userRepo.findOneBy.mockResolvedValue({ id: 1 } as any);

      await expect(service.register(dto)).rejects.toThrow(HttpException);
      await expect(service.register(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.ACCOUNT_EXISTED.code },
      });
    });

    it('should throw error if username already exists', async () => {
      /*
       * Flow: Register - Username Exists
       * 1. Query database for existing username.
       * 2. If username exists, throw USERNAME_EXISTED error.
       */
      userRepo.findOneBy.mockImplementation(async (query: any) => {
        if (query.username) return { id: 1 } as any;
        return null;
      });

      await expect(service.register(dto)).rejects.toThrow(HttpException);
      await expect(service.register(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.USERNAME_EXISTED.code },
      });
    });

    it('should successfully register user, hash password, save to redis and send OTP', async () => {
      /*
       * Flow: Register - Success
       * 1. Verify email and username do not exist.
       * 2. Check if OTP already exists to prevent spam.
       * 3. Hash the provided password.
       * 4. Cache user registration data in Redis.
       * 5. Generate and send SIGN_UP OTP via email.
       */
      userRepo.findOneBy.mockResolvedValue(null);
      mailService.isOTPExist.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(redisService.set).toHaveBeenCalled();
      expect(mailService.generateAndSendOTP).toHaveBeenCalledWith(
        dto.email,
        IMailType.SIGN_UP,
      );
      expect(result.message).toBeDefined();
    });
  });

  describe('verifyOtpAndExecuteAction', () => {
    const email = 'test@example.com';
    const code = '123456';

    it('should throw error if OTP is invalid', async () => {
      /*
       * Flow: Verify OTP - Invalid
       * 1. Verify provided OTP against stored value.
       * 2. If invalid or expired, throw INVALID_OTP error.
       */
      mailService.verifyOTP.mockResolvedValue(false);

      await expect(
        service.verifyOtpAndExecuteAction(email, code, IMailType.SIGN_UP),
      ).rejects.toThrow(HttpException);
      await expect(
        service.verifyOtpAndExecuteAction(email, code, IMailType.SIGN_UP),
      ).rejects.toMatchObject({
        response: { errorCode: httpErrors.INVALID_OTP.code },
      });
    });

    it('should verify SIGN_UP OTP and create user', async () => {
      /*
       * Flow: Verify OTP - SIGN_UP Success
       * 1. Verify OTP successfully.
       * 2. Retrieve cached registration data from Redis.
       * 3. Create and save new User entity.
       * 4. Delete registration data from Redis.
       */
      mailService.verifyOTP.mockResolvedValue(true);
      redisService.get.mockResolvedValue({
        email,
        username: 'testuser',
        password: 'pw',
      });
      userRepo.create.mockReturnValue({ id: 1, email } as any);
      userRepo.save.mockResolvedValue({ id: 1, email } as any);

      const result = await service.verifyOtpAndExecuteAction(
        email,
        code,
        IMailType.SIGN_UP,
      );

      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });
  });

  describe('signIn', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should throw error if user not found', async () => {
      /*
       * Flow: Sign In - User Not Found
       * 1. Query database for user by email.
       * 2. If user does not exist, throw ACCOUNT_NOT_FOUND error.
       */
      userRepo.findOneBy.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(HttpException);
      await expect(service.signIn(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.ACCOUNT_NOT_FOUND.code },
      });
    });

    it('should throw error if password does not match', async () => {
      /*
       * Flow: Sign In - Invalid Password
       * 1. Query user by email.
       * 2. Compare provided password with stored hashed password.
       * 3. If password mismatch, throw INVALID_CREDENTIALS error.
       */
      userRepo.findOneBy.mockResolvedValue({
        email: dto.email,
        password: 'hashed',
        accessMethod: AccessMethod.EMAIL,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(HttpException);
      await expect(service.signIn(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.INVALID_CREDENTIALS.code },
      });
    });

    it('should generate tokens and login user', async () => {
      /*
       * Flow: Sign In - Success
       * 1. Retrieve active user by email.
       * 2. Verify password match.
       * 3. Generate Access Token and Refresh Token.
       * 4. Return tokens to client.
       */
      const user = {
        id: 1,
        email: dto.email,
        password: 'hashed',
        status: UserStatus.ACTIVE,
        accessMethod: AccessMethod.EMAIL,
      };
      userRepo.findOneBy.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      configService.getOrThrow.mockImplementation((key) => {
        if (key === EnvKey.JWT_REFRESH_TOKEN_EXPIRE) return '7d';
        return 'secret_or_time';
      });
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.signIn(dto);

      expect(result.accessToken).toBe('token');
      expect(result.refreshToken).toBe('token');
    });
  });

  describe('googleLogin', () => {
    it('should return null if req.user is empty', async () => {
      /*
       * Flow: Google Login - Empty Request
       * 1. Check if user object exists in request (from Passport Google Strategy).
       * 2. If empty, return null indicating failure.
       */
      const result = await service.googleLogin({});
      expect(result).toBeNull();
    });

    it('should create new user if google user not found and login', async () => {
      /*
       * Flow: Google Login - New User
       * 1. Query user by Google email.
       * 2. If not found, create and save new User entity with Google ID.
       * 3. Generate tokens for the new user.
       */
      const req = { user: { email: 'g@example.com', googleId: '123' } };
      userRepo.findOneBy.mockResolvedValue(null);
      userRepo.create.mockReturnValue({
        id: 1,
        email: 'g@example.com',
      } as any);
      userRepo.save.mockResolvedValue({
        id: 1,
        email: 'g@example.com',
      } as any);

      configService.getOrThrow.mockImplementation((key) => {
        if (key === EnvKey.JWT_REFRESH_TOKEN_EXPIRE) return '7d';
        return 'secret_or_time';
      });
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.googleLogin(req);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: '123' }),
      );
      expect(result?.accessToken).toBe('token');
    });
  });

  describe('forgotPassword', () => {
    it('should throw error if user not found', async () => {
      /*
       * Flow: Forgot Password - User Not Found
       * 1. Query database for user by email.
       * 2. If user does not exist, throw ACCOUNT_NOT_FOUND error.
       */
      userRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.forgotPassword({ email: 'x@ex.com' }),
      ).rejects.toThrow(HttpException);
    });

    it('should generate and send OTP', async () => {
      /*
       * Flow: Forgot Password - Success
       * 1. Retrieve user by email and verify active status.
       * 2. Ensure no duplicate OTP exists.
       * 3. Generate and send FORGOT_PASSWORD OTP.
       */
      userRepo.findOneBy.mockResolvedValue({
        id: 1,
        status: UserStatus.ACTIVE,
      } as any);
      mailService.isOTPExist.mockResolvedValue(false);

      const result = await service.forgotPassword({ email: 'x@ex.com' });
      expect(mailService.generateAndSendOTP).toHaveBeenCalledWith(
        'x@ex.com',
        IMailType.FORGOT_PASSWORD,
      );
      expect(result.message).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should reset password if OTP is valid', async () => {
      /*
       * Flow: Reset Password - Success
       * 1. Verify provided OTP.
       * 2. Retrieve user by email.
       * 3. Hash the new password and update user in database.
       * 4. Clear the OTP to prevent reuse.
       */
      mailService.verifyOTP.mockResolvedValue(true);
      userRepo.findOneBy.mockResolvedValue({
        id: 1,
        email: 'x@ex.com',
      } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');

      const result = await service.resetPassword({
        email: 'x@ex.com',
        code: '123',
        password: 'new',
      });

      expect(userRepo.update).toHaveBeenCalledWith(1, {
        password: 'new_hash',
      });
      expect(mailService.clearOTP).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });
  });
});
