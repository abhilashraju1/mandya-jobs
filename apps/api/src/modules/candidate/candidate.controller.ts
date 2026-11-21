import { Controller, Post, Get, Body, Param, Headers, ForbiddenException } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { AuthService } from '../auth/auth.service';
import { RoleType } from '@mandya-jobs/types';

@Controller('candidate')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly authService: AuthService
  ) {}

  @Post('profile')
  saveProfile(@Headers() headers: Record<string, any>, @Body() body: any) {
    const user = this.authService.extractUserFromHeaders(headers);
    const candidateId = user.sub || user.id;
    return this.candidateService.saveProfile({
      ...body,
      id: candidateId,
      candidateId: candidateId,
      phone: user.phoneNumber || body.phone,
    });
  }

  @Get('profile/me')
  getMyProfile(@Headers() headers: Record<string, any>) {
    const user = this.authService.extractUserFromHeaders(headers);
    return this.candidateService.getProfile(user.sub || user.id);
  }

  @Get('profile/:id')
  getProfile(@Headers() headers: Record<string, any>, @Param('id') id: string) {
    const user = this.authService.extractUserFromHeaders(headers);
    const userId = user.sub || user.id;
    const isOwner = userId === id;
    const isStaff = user.roles?.some((r: RoleType) =>
      [RoleType.SUPER_ADMIN, RoleType.MODERATOR, RoleType.EMPLOYER_RECRUITER].includes(r)
    );
    if (!isOwner && !isStaff) {
      throw new ForbiddenException('You cannot access another candidate profile');
    }
    return this.candidateService.getProfile(id);
  }
}
