import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { AuthService } from '../auth/auth.service';
import { JobDTO, JobFilterParams, JobStatus, RoleType } from '@mandya-jobs/types';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly authService: AuthService
  ) {}

  private getAdminUser(headers: Record<string, any>): any {
    const user = this.authService.extractUserFromHeaders(headers);
    if (
      !user ||
      !user.roles ||
      (!user.roles.includes(RoleType.SUPER_ADMIN) && !user.roles.includes(RoleType.MODERATOR))
    ) {
      throw new UnauthorizedException('Admin moderation privileges required');
    }
    return user;
  }

  @Get()
  getAllPublished(@Query() filters: JobFilterParams) {
    return this.jobsService.getAllPublished(filters);
  }

  @Get('moderation/queue')
  getModerationQueue(@Headers() headers: Record<string, any>, @Query('status') status?: JobStatus) {
    this.getAdminUser(headers);
    return this.jobsService.getModerationQueue(status);
  }

  @Post('reset')
  resetJobs(@Headers() headers: Record<string, any>) {
    // Only authorized testing or admin session can reset
    if (process.env.NODE_ENV === 'production') {
      this.getAdminUser(headers);
    }
    return this.jobsService.resetJobs();
  }

  @Post('seed')
  seedJobs(@Headers() headers: Record<string, any>) {
    if (process.env.NODE_ENV === 'production') {
      this.getAdminUser(headers);
    }
    return this.jobsService.seedJobs();
  }

  @Get(':id')
  getById(@Param('id') id: string, @Headers() headers: Record<string, any>) {
    let isPrivileged = false;
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      if (
        user &&
        user.roles &&
        (user.roles.includes(RoleType.SUPER_ADMIN) || user.roles.includes(RoleType.MODERATOR))
      ) {
        isPrivileged = true;
      }
    } catch {
      isPrivileged = false;
    }
    return this.jobsService.getById(id, isPrivileged);
  }

  @Post()
  createDraft(@Body() data: Partial<JobDTO>) {
    return this.jobsService.createDraft(data);
  }

  @Post(':id/submit')
  submitForReview(@Param('id') id: string) {
    return this.jobsService.submitForReview(id);
  }

  @Post(':id/verify-employer')
  verifyEmployer(@Param('id') id: string, @Headers() headers: Record<string, any>) {
    const admin = this.getAdminUser(headers);
    return this.jobsService.verifyEmployer(id, admin.sub || admin.id || 'admin_officer_mandya');
  }

  @Post(':id/moderate')
  moderateJob(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>,
    @Body()
    body: {
      action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY_EMPLOYER' | 'CLOSE';
      reason?: string;
    }
  ) {
    const admin = this.getAdminUser(headers);
    return this.jobsService.moderateJob(id, body.action, body.reason, admin.sub || admin.id || 'admin_officer_mandya');
  }
}
