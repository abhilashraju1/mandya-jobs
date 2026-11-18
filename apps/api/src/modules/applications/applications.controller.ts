import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus, RoleType } from '@mandya-jobs/types';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  apply(
    @Body()
    body: {
      jobId: string;
      candidate: { id: string; name: string; phone: string; taluk?: string; matchScore?: number; resumeUrl?: string };
      coverNote?: string;
    }
  ) {
    return this.applicationsService.apply(body.jobId, body.candidate, body.coverNote);
  }

  @Get('candidate/:candidateId')
  getByCandidate(@Param('candidateId') candidateId: string) {
    return this.applicationsService.getByCandidate(candidateId);
  }

  @Get('job/:jobId')
  getByJob(@Param('jobId') jobId: string, @Query('orgId') orgId?: string) {
    return this.applicationsService.getByJob(jobId, orgId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.applicationsService.getById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ApplicationStatus; note?: string; actorRole?: RoleType }
  ) {
    return this.applicationsService.updateStatus(id, body.status, body.note, body.actorRole);
  }

  @Post(':id/interview')
  scheduleInterview(
    @Param('id') id: string,
    @Body() body: { scheduledDate: string; venueOrLink: string; instructions?: string }
  ) {
    return this.applicationsService.scheduleInterview(id, body);
  }

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Body() body: { candidateId: string }) {
    return this.applicationsService.withdraw(id, body.candidateId);
  }
}
