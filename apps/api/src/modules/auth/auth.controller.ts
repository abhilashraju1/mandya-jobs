import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtpCanonical(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtpAlias(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtpCanonical(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otpCode') otpCode: string,
  ) {
    return this.authService.verifyOtp(phoneNumber, otpCode);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtpAlias(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otpCode') otpCode: string,
  ) {
    return this.authService.verifyOtp(phoneNumber, otpCode);
  }

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body('passcode') passcode: string) {
    return this.authService.adminLogin(passcode);
  }

  @Post('recruiter-login')
  @HttpCode(HttpStatus.OK)
  async recruiterLogin(@Body('orgId') orgId?: string, @Body('recruiterId') recruiterId?: string) {
    return this.authService.recruiterLogin(orgId || 'org_1', recruiterId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing');
    }
    const token = authHeader.substring(7);
    const decoded = this.authService.validateToken(token);
    return {
      id: decoded.sub,
      phoneNumber: decoded.phoneNumber,
      roles: decoded.roles,
      fullName: decoded.fullName,
    };
  }
}
