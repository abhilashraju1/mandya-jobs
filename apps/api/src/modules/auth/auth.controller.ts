import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body('phoneNumber') phoneNumber: string) {
    return this.authService.sendOtp(phoneNumber);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('otpCode') otpCode: string,
  ) {
    return this.authService.verifyOtp(phoneNumber, otpCode);
  }
}
