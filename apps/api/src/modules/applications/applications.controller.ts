import { Controller, Get, Post, Patch, Body, Param, Query, Headers, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthService } from '../auth/auth.service';
import { ApplicationStatus, RoleType } from '@mandya-jobs/types';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly authService: AuthService
  ) {}

  @Get()
  getAll(@Headers() headers: Record<string, any>) {
    const user = this.authService.extractUserFromHeaders(headers);
    if (user.roles?.includes(RoleType.SUPER_ADMIN) || user.roles?.includes(RoleType.MODERATOR)) {
      return this.applicationsService.getAll();
    }
    if (user.roles?.includes(RoleType.EMPLOYER_RECRUITER)) {
      const orgId = user.organizationId || user.orgId || 'org_1';
      return this.applicationsService.getByOrg(orgId);
    }
    // Candidate caller only sees their own applications
    const candidateId = user.sub || user.id;
    return this.applicationsService.getByCandidate(candidateId);
  }

  @Post('reset')
  resetApplications(@Headers() headers: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      const user = this.authService.extractUserFromHeaders(headers);
      if (!user.roles?.includes(RoleType.SUPER_ADMIN)) {
        throw new ForbiddenException('Admin privileges required to reset applications');
      }
    }
    return this.applicationsService.resetApplications();
  }

  @Post('seed')
  seedApplications(@Headers() headers: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      const user = this.authService.extractUserFromHeaders(headers);
      if (!user.roles?.includes(RoleType.SUPER_ADMIN)) {
        throw new ForbiddenException('Admin privileges required to seed applications');
      }
    }
    return this.applicationsService.seedApplications();
  }

  @Post()
  apply(
    @Headers() headers: Record<string, any>,
    @Body()
    body: {
      jobId: string;
      candidate?: { id?: string; name: string; phone: string; taluk?: string; matchScore?: number; resumeUrl?: string };
      coverNote?: string;
    }
  ) {
    let candidateId = body.candidate?.id || 'cand_1';
    let candidatePhone = body.candidate?.phone || '9845012345';
    let candidateName = body.candidate?.name || 'Candidate';

    try {
      const user = this.authService.extractUserFromHeaders(headers);
      candidateId = user.sub || user.id || candidateId;
      candidatePhone = user.phoneNumber || candidatePhone;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required to submit application');
      }
    }

    const candidateData = {
      ...(body.candidate || {}),
      id: candidateId,
      phone: candidatePhone,
      name: candidateName,
    };

    return this.applicationsService.apply(body.jobId, candidateData, body.coverNote);
  }

  @Get('candidate/:candidateId')
  getByCandidate(@Headers() headers: Record<string, any>, @Param('candidateId') candidateId: string) {
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      const isOwner = (user.sub || user.id) === candidateId;
      const isPrivileged = user.roles?.some((r: RoleType) =>
        [RoleType.SUPER_ADMIN, RoleType.MODERATOR, RoleType.EMPLOYER_RECRUITER].includes(r)
      );
      if (!isOwner && !isPrivileged) {
        throw new ForbiddenException('You cannot access another candidate applications');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required');
      }
    }
    return this.applicationsService.getByCandidate(candidateId);
  }

  @Get('job/:jobId')
  getByJob(
    @Headers() headers: Record<string, any>,
    @Param('jobId') jobId: string,
    @Query('orgId') orgId?: string
  ) {
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      const isPrivileged = user.roles?.some((r: RoleType) =>
        [RoleType.SUPER_ADMIN, RoleType.MODERATOR, RoleType.EMPLOYER_RECRUITER].includes(r)
      );
      if (!isPrivileged) {
        throw new ForbiddenException('Not authorized to view job applicant pipeline');
      }
      // If recruiter has specific orgId, ensure match
      if (user.roles?.includes(RoleType.EMPLOYER_RECRUITER) && user.orgId && orgId && user.orgId !== orgId) {
        throw new ForbiddenException('Cannot view applications for another organization');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required');
      }
    }
    return this.applicationsService.getByJob(jobId, orgId);
  }

  @Get(':id')
  getById(@Headers() headers: Record<string, any>, @Param('id') id: string) {
    const app = this.applicationsService.getById(id);
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      const isOwner = (user.sub || user.id) === app.candidateId;
      const isOrgRecruiter = user.roles?.includes(RoleType.EMPLOYER_RECRUITER) && (!user.orgId || user.orgId === app.orgId);
      const isAdmin = user.roles?.includes(RoleType.SUPER_ADMIN) || user.roles?.includes(RoleType.MODERATOR);
      if (!isOwner && !isOrgRecruiter && !isAdmin) {
        throw new ForbiddenException('Not authorized to view this application');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required');
      }
    }
    return app;
  }

  @Patch(':id/status')
  updateStatus(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() body: { status: ApplicationStatus; note?: string; actorRole?: RoleType }
  ) {
    let actorRole = body.actorRole || RoleType.EMPLOYER_RECRUITER;
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      const isRecruiter = user.roles?.includes(RoleType.EMPLOYER_RECRUITER);
      const isAdmin = user.roles?.includes(RoleType.SUPER_ADMIN) || user.roles?.includes(RoleType.MODERATOR);
      if (!isRecruiter && !isAdmin) {
        throw new ForbiddenException('Only authorized recruiters or admins can update application status');
      }
      const app = this.applicationsService.getById(id);
      if (isRecruiter && user.orgId && app.orgId && user.orgId !== app.orgId) {
        throw new ForbiddenException('Cannot modify application for another organization');
      }
      actorRole = isAdmin ? RoleType.MODERATOR : RoleType.EMPLOYER_RECRUITER;
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required to modify application status');
      }
    }
    return this.applicationsService.updateStatus(id, body.status, body.note, actorRole);
  }

  @Post(':id/interview')
  scheduleInterview(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() body: { scheduledDate: string; venueOrLink: string; instructions?: string }
  ) {
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      const isRecruiter = user.roles?.includes(RoleType.EMPLOYER_RECRUITER);
      const isAdmin = user.roles?.includes(RoleType.SUPER_ADMIN) || user.roles?.includes(RoleType.MODERATOR);
      if (!isRecruiter && !isAdmin) {
        throw new ForbiddenException('Only authorized recruiters or admins can schedule interviews');
      }
      const app = this.applicationsService.getById(id);
      if (isRecruiter && user.orgId && app.orgId && user.orgId !== app.orgId) {
        throw new ForbiddenException('Cannot schedule interview for another organization');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required to schedule interview');
      }
    }
    return this.applicationsService.scheduleInterview(id, body);
  }

  @Post(':id/withdraw')
  withdraw(
    @Headers() headers: Record<string, any>,
    @Param('id') id: string,
    @Body() body?: { candidateId?: string }
  ) {
    let candidateId = body?.candidateId || 'cand_1';
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      candidateId = user.sub || user.id || candidateId;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required to withdraw application');
      }
    }
    return this.applicationsService.withdraw(id, candidateId);
  }
}
