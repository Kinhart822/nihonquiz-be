import { EnvKey } from '@constants/env.constant';
import { IMailType } from '@constants/mail.constant';
import { UserStatus } from '@constants/user.constant';
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
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;
  let redisService: jest.Mocked<RedisService>;

  const mockUserRepository = {
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
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
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
      userRepository.findOneBy.mockResolvedValue({ id: 1 } as any);

      await expect(service.register(dto)).rejects.toThrow(HttpException);
      await expect(service.register(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.ACCOUNT_EXISTED.code },
      });
    });

    it('should throw error if username already exists', async () => {
      userRepository.findOneBy.mockImplementation(async (query: any) => {
        if (query.username) return { id: 1 } as any;
        return null;
      });

      await expect(service.register(dto)).rejects.toThrow(HttpException);
      await expect(service.register(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.USERNAME_EXISTED.code },
      });
    });

    it('should successfully register user, hash password, save to redis and send OTP', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
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
      mailService.verifyOTP.mockResolvedValue(true);
      redisService.get.mockResolvedValue({
        email,
        username: 'testuser',
        password: 'pw',
      });
      userRepository.create.mockReturnValue({ id: 1, email } as any);
      userRepository.save.mockResolvedValue({ id: 1, email } as any);

      const result = await service.verifyOtpAndExecuteAction(
        email,
        code,
        IMailType.SIGN_UP,
      );

      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });
  });

  describe('signIn', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('should throw error if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(HttpException);
      await expect(service.signIn(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.ACCOUNT_NOT_FOUND.code },
      });
    });

    it('should throw error if password does not match', async () => {
      userRepository.findOneBy.mockResolvedValue({
        email: dto.email,
        password: 'hashed',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(dto)).rejects.toThrow(HttpException);
      await expect(service.signIn(dto)).rejects.toMatchObject({
        response: { errorCode: httpErrors.INVALID_CREDENTIALS.code },
      });
    });

    it('should generate tokens and login user', async () => {
      const user = {
        id: 1,
        email: dto.email,
        password: 'hashed',
        status: UserStatus.ACTIVE,
      };
      userRepository.findOneBy.mockResolvedValue(user as any);
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
      const result = await service.googleLogin({});
      expect(result).toBeNull();
    });

    it('should create new user if google user not found and login', async () => {
      const req = { user: { email: 'g@example.com', googleId: '123' } };
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        id: 1,
        email: 'g@example.com',
      } as any);
      userRepository.save.mockResolvedValue({
        id: 1,
        email: 'g@example.com',
      } as any);

      configService.getOrThrow.mockImplementation((key) => {
        if (key === EnvKey.JWT_REFRESH_TOKEN_EXPIRE) return '7d';
        return 'secret_or_time';
      });
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.googleLogin(req);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: '123' }),
      );
      expect(result?.accessToken).toBe('token');
    });
  });

  describe('forgotPassword', () => {
    it('should throw error if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.forgotPassword({ email: 'x@ex.com' }),
      ).rejects.toThrow(HttpException);
    });

    it('should generate and send OTP', async () => {
      userRepository.findOneBy.mockResolvedValue({
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
      mailService.verifyOTP.mockResolvedValue(true);
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'x@ex.com',
      } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');

      const result = await service.resetPassword({
        email: 'x@ex.com',
        code: '123',
        password: 'new',
      });

      expect(userRepository.update).toHaveBeenCalledWith(1, {
        password: 'new_hash',
      });
      expect(mailService.clearOTP).toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });
  });
});
