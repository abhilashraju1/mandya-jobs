import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleType } from '@mandya-jobs/types';

@Injectable()
export class AuthService {
  // In-memory OTP store for rate-limiting & development verification
  private otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

  constructor(private jwtService: JwtService) {}

  async sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const cleanPhone = phoneNumber.replace(/[\s-+]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Please provide a valid 10-digit Indian mobile number');
    }

    const existing = this.otpStore.get(cleanPhone);
    const now = Date.now();
    if (existing && existing.expiresAt > now && existing.attempts >= 3) {
      throw new BadRequestException('Too many attempts. Please wait 5 minutes before requesting a new OTP.');
    }

    // Default development OTP code is 123456 or randomly generated
    const otpCode = process.env.NODE_ENV === 'production' 
      ? Math.floor(100000 + Math.random() * 900000).toString() 
      : '123456';

    this.otpStore.set(cleanPhone, {
      code: otpCode,
      expiresAt: now + 300 * 1000, // 5 minutes
      attempts: 0,
    });

    return {
      success: true,
      message: 'OTP sent successfully (Development code: 123456)',
      expiresIn: 300,
    };
  }

  async verifyOtp(phoneNumber: string, otpCode: string): Promise<{ token: string; user: any }> {
    const cleanPhone = phoneNumber.replace(/[\s-+]/g, '');
    const record = this.otpStore.get(cleanPhone);

    if (!record || record.expiresAt < Date.now()) {
      throw new UnauthorizedException('OTP has expired or was not requested');
    }

    record.attempts += 1;
    if (record.code !== otpCode) {
      if (record.attempts >= 5) {
        this.otpStore.delete(cleanPhone);
        throw new UnauthorizedException('Maximum attempts exceeded. Please request a new OTP.');
      }
      throw new UnauthorizedException('Invalid OTP code');
    }

    // OTP verified successfully
    this.otpStore.delete(cleanPhone);

    const payload = {
      sub: `user_${cleanPhone}`,
      phoneNumber: cleanPhone,
      roles: [RoleType.CANDIDATE],
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: payload.sub,
        phoneNumber: cleanPhone,
        roles: payload.roles,
        preferredLang: 'kn',
      },
    };
  }
}
