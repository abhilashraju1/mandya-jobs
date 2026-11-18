import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobDTO, JobFilterParams, JobStatus } from '@mandya-jobs/types';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  getAllPublished(@Query() filters: JobFilterParams) {
    return this.jobsService.getAllPublished(filters);
  }

  @Get('moderation/queue')
  getModerationQueue(@Query('status') status?: JobStatus) {
    return this.jobsService.getModerationQueue(status);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.jobsService.getById(id);
  }

  @Post()
  createDraft(@Body() data: Partial<JobDTO>) {
    return this.jobsService.createDraft(data);
  }

  @Post(':id/submit')
  submitForReview(@Param('id') id: string) {
    return this.jobsService.submitForReview(id);
  }

  @Post(':id/moderate')
  moderateJob(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'; reason?: string; reviewerId?: string }
  ) {
    return this.jobsService.moderateJob(id, body.action, body.reason, body.reviewerId);
  }
}
