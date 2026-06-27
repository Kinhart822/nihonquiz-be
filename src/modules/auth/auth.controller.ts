import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser, PublicRoute } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { AuthService } from './auth.service';
import {
  EmailBodyReqDto,
  LoginReqDto,
  RefreshTokenReqDto,
  RegisterReqDto,
  ResendCodeReqDto,
  ResetPasswordReqDto,
  VerifyEmailCodeReqDto,
} from './dtos/auth.req.dto';
import {
  LoginResDto,
  RefreshTokenResDto,
  RegisterResDto,
} from './dtos/auth.res.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== REGISTER & LOGIN ====================
  @Post('/register')
  @PublicRoute()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: RegisterResDto,
    description: 'User registered successfully',
  })
  async registerUser(@Body() dto: RegisterReqDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @PublicRoute()
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginResDto,
    description: 'User logged in successfully',
  })
  async login(@Body() dto: LoginReqDto) {
    return this.authService.signIn(dto);
  }

  // ==================== LOGOUT ====================
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
  })
  async logout(@AuthUser() user: JwtPayloadDto) {
    return this.authService.logout(user.id);
  }

  // ==================== OTP & PASSWORD ====================
  @Post('verify-otp')
  @PublicRoute()
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully',
  })
  async verifyOtp(@Body() dto: VerifyEmailCodeReqDto) {
    return this.authService.verifyOtpAndExecuteAction(
      dto.email,
      dto.code,
      dto.type,
    );
  }

  @Post('forgot-password')
  @PublicRoute()
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reset code sent successfully',
  })
  async forgotPassword(@Body() dto: EmailBodyReqDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @PublicRoute()
  @ApiOperation({ summary: 'Reset password with code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  async resetPassword(@Body() dto: ResetPasswordReqDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('resend-code')
  @PublicRoute()
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code resent successfully',
  })
  async resendCode(@Body() dto: ResendCodeReqDto) {
    return this.authService.resendCode(dto);
  }

  // ==================== REFRESH TOKEN ====================
  @Post('refresh-token')
  @PublicRoute()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RefreshTokenResDto,
    description: 'Token refreshed successfully',
  })
  async refreshToken(@Body() dto: RefreshTokenReqDto) {
    return this.authService.refreshToken(dto);
  }

  // ==================== GOOGLE AUTH ====================
  @UseGuards(GoogleAuthGuard)
  @PublicRoute()
  @Get('google')
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @PublicRoute()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google auth callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginResDto,
    description: 'User logged in via Google successfully',
  })
  async googleAuthRedirect(@Req() req: any) {
    return this.authService.googleLogin(req);
  }
}
