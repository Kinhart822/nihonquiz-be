import { EnvKey } from '@constants/env.constant';
import { getRegisterDataKey, MAIL_ACTION_TTL } from '@constants/redis.constant';
import {
  AccessMethod,
  FORGOT_PASSWORD_RES,
  LOGOUT_RES,
  REGISTER_RES,
  RESEND_RES,
  RESET_PASSWORD_RES,
  UserStatus,
  VERIFY_ACCOUNT_RES,
} from '@constants/user.constant';
import { UserRepository } from '@database/repository/user.repository';
import { RedisService } from '@modules/redis/redis.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import {
  httpBadRequest,
  httpErrors,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { parseDuration } from '@utils/util';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { Transactional } from 'typeorm-transactional';
import {
  EmailBodyReqDto,
  LoginReqDto,
  RefreshTokenReqDto,
  RegisterReqDto,
  ResendCodeReqDto,
  ResetPasswordReqDto,
} from './dtos/auth.req.dto';
import {
  LoginResDto,
  RefreshTokenResDto,
  RegisterResDto,
} from './dtos/auth.res.dto';

import { IMailType } from '@constants/mail.constant';
import { UserEntity } from '@entities/user.entity';
import { MailService } from '@modules/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  // ==================== VALIDATION ====================
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(
    password: string,
    storePasswordHash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, storePasswordHash);
  }

  // Validate user
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Partial<UserEntity> | null> {
    const user = await this.userRepo.findOneBy({ email });
    if (
      user &&
      user.password &&
      (await this.comparePassword(pass, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  // Generate JWT Token
  private async generateToken(payload: JwtPayloadDto) {
    const refreshTokenSecret = this.configService.getOrThrow<string>(
      EnvKey.JWT_REFRESH_SECRET_KEY,
    );
    const refreshTokenExpiresIn = this.configService.getOrThrow<string>(
      EnvKey.JWT_REFRESH_TOKEN_EXPIRE,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: parseDuration(refreshTokenExpiresIn),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ==================== REGISTER & LOGIN ====================
  // Register
  async register(dto: RegisterReqDto) {
    const { email, username, password } = dto;

    // Check account existed
    const account = await this.userRepo.findOneBy({ email });
    if (account) {
      throw new httpBadRequest(
        httpErrors.ACCOUNT_EXISTED.message,
        httpErrors.ACCOUNT_EXISTED.code,
      );
    }

    // Check username existed
    const usernameExisted = await this.userRepo.findOneBy({ username });
    if (usernameExisted) {
      throw new httpBadRequest(
        httpErrors.USERNAME_EXISTED.message,
        httpErrors.USERNAME_EXISTED.code,
      );
    }

    // Check OTP existed
    const isOTPExist = await this.mailService.isOTPExist(
      email,
      IMailType.SIGN_UP,
    );
    if (isOTPExist) {
      throw new httpBadRequest(
        httpErrors.OTP_ALREADY_SENT.message,
        httpErrors.OTP_ALREADY_SENT.code,
      );
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Store registration data in Redis pending OTP verification
    const registerDataKey = getRegisterDataKey(email);
    await this.redisService.set(
      registerDataKey,
      { email, username, password: hashedPassword },
      MAIL_ACTION_TTL,
    );

    // Send OTP for email verification
    await this.mailService.generateAndSendOTP(email, IMailType.SIGN_UP);

    return {
      message: REGISTER_RES,
    };
  }

  // Login with Email/Password
  async signIn(dto: LoginReqDto): Promise<LoginResDto> {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    if (user!.accessMethod !== AccessMethod.EMAIL) {
      throw new httpBadRequest(
        httpErrors.INVALID_LOGIN_METHOD.message,
        httpErrors.INVALID_LOGIN_METHOD.code,
      );
    }

    const isMatch = await this.comparePassword(dto.password, user!.password!);
    if (!isMatch) {
      throw new httpBadRequest(
        httpErrors.INVALID_CREDENTIALS.message,
        httpErrors.INVALID_CREDENTIALS.code,
      );
    }

    if (user!.status === UserStatus.INACTIVE) {
      user!.status = UserStatus.ACTIVE;
      await this.userRepo.update(user!.id, { status: UserStatus.ACTIVE });
    } else if (user!.status === UserStatus.BLOCKED) {
      throw new httpBadRequest(
        httpErrors.BLOCKED_USER.message,
        httpErrors.BLOCKED_USER.code,
      );
    }

    return this.login(user!);
  }

  // Core login logic for all methods
  async login(user: UserEntity): Promise<LoginResDto> {
    const payload: JwtPayloadDto = {
      email: user!.email,
      id: user!.id,
      status: UserStatus.ACTIVE,
      role: user!.role,
    };
    const { accessToken, refreshToken } = await this.generateToken(payload);

    return plainToInstance(LoginResDto, {
      accessToken,
      refreshToken,
      userId: user!.id,
    });
  }

  // ==================== LOGOUT ====================
  // Logout
  async logout(userId: number): Promise<any> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    if (user!.status === UserStatus.INACTIVE) {
      throw new httpBadRequest(
        httpErrors.ALREADY_LOGOUT.message,
        httpErrors.ALREADY_LOGOUT.code,
      );
    }

    await this.userRepo.update(userId, { status: UserStatus.INACTIVE });
    return { message: LOGOUT_RES };
  }

  // ==================== OTP & PASSWORD ====================
  /**
   * Verify OTP and execute pre-defined action
   */
  @Transactional()
  async verifyOtpAndExecuteAction(
    email: string,
    code: string,
    type: IMailType,
  ) {
    const isVerified = await this.mailService.verifyOTP(
      email,
      code,
      type,
      type === IMailType.FORGOT_PASSWORD, // Persist if it's forgot password
    );
    if (!isVerified) {
      throw new httpBadRequest(
        httpErrors.INVALID_OTP.message,
        httpErrors.INVALID_OTP.code,
      );
    }

    switch (type) {
      case IMailType.SIGN_UP: {
        const registerDataKey = getRegisterDataKey(email);
        const registerData = await this.redisService.get<any>(registerDataKey);

        if (!registerData) {
          throw new httpBadRequest(
            httpErrors.INVALID_REGISTER_OTP.message,
            httpErrors.INVALID_REGISTER_OTP.code,
          );
        }

        const newUser = this.userRepo.create({
          email: registerData.email,
          username: registerData.username,
          password: registerData.password,
          accessMethod: AccessMethod.EMAIL,
          status: UserStatus.ACTIVE,
        });

        const savedUser = await this.userRepo.save(newUser);
        await this.redisService.del(registerDataKey);

        return {
          message: VERIFY_ACCOUNT_RES(type),
          user: plainToInstance(RegisterResDto, savedUser, {
            excludeExtraneousValues: true,
          }),
        };
      }

      case IMailType.FORGOT_PASSWORD: {
        const user = await this.userRepo.findOneBy({ email });
        if (!user) {
          throw new httpNotFound(
            httpErrors.ACCOUNT_NOT_FOUND.message,
            httpErrors.ACCOUNT_NOT_FOUND.code,
          );
        }
        return { message: VERIFY_ACCOUNT_RES(type) };
      }

      default:
        return { message: VERIFY_ACCOUNT_RES(type) };
    }
  }

  // Forgot Password
  async forgotPassword(dto: EmailBodyReqDto): Promise<any> {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    if (user!.status === UserStatus.BLOCKED) {
      throw new httpBadRequest(
        httpErrors.BLOCKED_USER.message,
        httpErrors.BLOCKED_USER.code,
      );
    }

    const isOTPExist = await this.mailService.isOTPExist(
      dto.email,
      IMailType.FORGOT_PASSWORD,
    );
    if (isOTPExist) {
      throw new httpBadRequest(
        httpErrors.OTP_ALREADY_SENT.message,
        httpErrors.OTP_ALREADY_SENT.code,
      );
    }

    // Send OTP for forgot password
    await this.mailService.generateAndSendOTP(
      dto.email,
      IMailType.FORGOT_PASSWORD,
    );

    return { message: FORGOT_PASSWORD_RES };
  }

  // Reset Password
  @Transactional()
  async resetPassword(dto: ResetPasswordReqDto): Promise<any> {
    const { email, code, password } = dto;

    const isVerified = await this.mailService.verifyOTP(
      email,
      code,
      IMailType.FORGOT_PASSWORD,
      true, // Persist OTP for action
    );

    if (!isVerified) {
      throw new httpBadRequest(
        httpErrors.INVALID_OTP.message,
        httpErrors.INVALID_OTP.code,
      );
    }

    const user = await this.userRepo.findOneBy({ email });
    if (!user) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    const hashedPassword = await this.hashPassword(password);
    await this.userRepo.update(user!.id, { password: hashedPassword });
    await this.mailService.clearOTP(email, IMailType.FORGOT_PASSWORD);

    return { message: RESET_PASSWORD_RES };
  }

  // Resend Code
  async resendCode(dto: ResendCodeReqDto): Promise<any> {
    const { email, type } = dto;

    if (type === IMailType.SIGN_UP) {
      const registerDataKey = getRegisterDataKey(email);
      const registerData = await this.redisService.get(registerDataKey);

      if (!registerData) {
        throw new httpBadRequest(
          httpErrors.INVALID_REGISTER_OTP.message,
          httpErrors.INVALID_REGISTER_OTP.code,
        );
      }
    } else {
      const user = await this.userRepo.findOneBy({ email });

      if (!user) {
        throw new httpNotFound(
          httpErrors.ACCOUNT_NOT_FOUND.message,
          httpErrors.ACCOUNT_NOT_FOUND.code,
        );
      }

      if (user!.status === UserStatus.BLOCKED) {
        throw new httpBadRequest(
          httpErrors.BLOCKED_USER.message,
          httpErrors.BLOCKED_USER.code,
        );
      }
    }

    await this.mailService.generateAndSendOTP(email, type);

    return { message: RESEND_RES(type) };
  }

  // ==================== REFRESH TOKEN ====================
  // Refresh token
  async refreshToken(data: RefreshTokenReqDto): Promise<RefreshTokenResDto> {
    const { refreshToken } = data;
    const decodedData: JwtPayloadDto = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: this.configService.getOrThrow(EnvKey.JWT_REFRESH_SECRET_KEY),
      },
    );

    const user = await this.userRepo.findOneBy({ id: decodedData.id });

    if (!user || user!.status !== UserStatus.ACTIVE) {
      throw new httpNotFound(
        httpErrors.ACCOUNT_NOT_FOUND.message,
        httpErrors.ACCOUNT_NOT_FOUND.code,
      );
    }

    const payload: JwtPayloadDto = {
      id: user!.id,
      email: user!.email,
      status: user!.status,
      role: user!.role,
    };

    return this.generateToken(payload);
  }

  // ==================== GOOGLE AUTH ====================
  // Login/Register with Google
  @Transactional()
  async googleLogin(req: any): Promise<LoginResDto | null> {
    if (!req.user) return null;
    const { email, googleId } = req.user;
    this.logger.log(`Google Login Attempt: ${email} (${googleId})`);

    let user = await this.userRepo.findOneBy({ googleId });

    if (!user) {
      // Check if user exists with the same email
      user = await this.userRepo.findOneBy({ email });
      if (user) {
        // Link googleId to existing user
        user.googleId = googleId;
        if (user!.status === UserStatus.INACTIVE) {
          user!.status = UserStatus.ACTIVE;
        } else if (user!.status === UserStatus.BLOCKED) {
          throw new httpBadRequest(
            httpErrors.BLOCKED_USER.message,
            httpErrors.BLOCKED_USER.code,
          );
        }
        await this.userRepo.save(user);
      } else {
        // Create new user
        user = this.userRepo.create({
          email,
          googleId,
          accessMethod: AccessMethod.GOOGLE,
          status: UserStatus.ACTIVE,
        });
        await this.userRepo.save(user);
      }
    }

    return this.login(user!);
  }
}
