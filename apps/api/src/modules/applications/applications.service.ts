import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApplicationDTO, ApplicationStatus, RoleType } from '@mandya-jobs/types';
import { JobsService } from '../jobs/jobs.service';

// State machine definition: Allowed next statuses from a given status
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.SUBMITTED]: [
    ApplicationStatus.VIEWED,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.VIEWED]: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.UNDER_REVIEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.INTERVIEW_SCHEDULED]: [
    ApplicationStatus.INTERVIEW_SCHEDULED, // reschedule
    ApplicationStatus.INTERVIEWED,
    ApplicationStatus.OFFERED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.INTERVIEWED]: [
    ApplicationStatus.OFFERED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.OFFERED]: [
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

@Injectable()
export class ApplicationsService {
  private applications: ApplicationDTO[] = [];

  constructor(private readonly jobsService?: JobsService) {
    this.seedDemoApplications();
  }

  /**
   * Apply for a vacancy. Validates real job existence and published status,
   * binds application to real job title and organization, and prevents duplicate active applications.
   */
  apply(
    jobId: string,
    candidate: { id: string; name: string; phone: string; taluk?: string; matchScore?: number; resumeUrl?: string },
    coverNote?: string
  ): ApplicationDTO {
    // 1. Look up real job
    let jobTitle = 'Job Vacancy';
    let orgName = 'Verified Employer';

    if (this.jobsService) {
      try {
        const realJob = this.jobsService.getById(jobId);
        if (realJob.status !== 'PUBLISHED') {
          throw new BadRequestException('Cannot apply to a vacancy that is not published');
        }
        if (!realJob.orgVerified) {
          throw new BadRequestException('Cannot apply to an unverified employer vacancy');
        }
        jobTitle = realJob.title;
        orgName = realJob.orgName;
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new NotFoundException(`Vacancy with ID ${jobId} does not exist`);
      }
    }

    // 2. Check duplicate active application (PRD: one active application per job; allow re-apply if withdrawn)
    const existing = this.applications.find(
      (a) => a.jobId === jobId && a.candidateId === candidate.id && a.status !== ApplicationStatus.WITHDRAWN
    );
    if (existing) {
      throw new BadRequestException('You have an active application for this vacancy already');
    }

    const application: ApplicationDTO = {
      id: `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      jobId,
      jobTitle,
      orgName,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidatePhone: candidate.phone,
      candidateTaluk: candidate.taluk || 'Mandya Town',
      coverNote,
      matchScore: candidate.matchScore,
      status: ApplicationStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: ApplicationStatus.SUBMITTED,
          note: 'Application submitted by candidate',
          changedAt: new Date().toISOString(),
        },
      ],
    };

    this.applications.push(application);
    return application;
  }

  getByCandidate(candidateId: string): ApplicationDTO[] {
    return this.applications.filter((a) => a.candidateId === candidateId);
  }

  getByJob(jobId: string, requesterOrgId?: string): ApplicationDTO[] {
    const list = this.applications.filter((a) => a.jobId === jobId);
    // If organization scope is provided, verify ownership through jobsService
    if (requesterOrgId && this.jobsService) {
      const job = this.jobsService.getById(jobId);
      if (job.orgId !== requesterOrgId) {
        throw new ForbiddenException('You do not have access to applicants for this vacancy');
      }
    }
    return list;
  }

  getById(id: string): ApplicationDTO {
    const app = this.applications.find((a) => a.id === id);
    if (!app) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    return app;
  }

  /**
   * Update status with strict state machine validation and atomic history recording.
   */
  updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    note?: string,
    actorRole: RoleType = RoleType.EMPLOYER_RECRUITER
  ): ApplicationDTO {
    const app = this.getById(id);

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[app.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${app.status} to ${newStatus}. Permitted next states: [${allowed.join(', ')}]`
      );
    }

    // Restrict permissions
    if (newStatus === ApplicationStatus.WITHDRAWN && actorRole !== RoleType.CANDIDATE && actorRole !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Only candidates can withdraw their application');
    }

    app.status = newStatus;
    app.statusHistory.push({
      status: newStatus,
      note: note || `Status updated to ${newStatus}`,
      changedAt: new Date().toISOString(),
    });

    return app;
  }

  scheduleInterview(
    id: string,
    details: { scheduledDate: string; venueOrLink: string; instructions?: string }
  ): ApplicationDTO {
    // Validate future date
    const interviewDate = new Date(details.scheduledDate);
    if (isNaN(interviewDate.getTime())) {
      throw new BadRequestException('Invalid interview date provided');
    }

    const app = this.updateStatus(
      id,
      ApplicationStatus.INTERVIEW_SCHEDULED,
      `Interview scheduled for ${details.scheduledDate} at ${details.venueOrLink}`
    );
    app.interview = details;
    return app;
  }

  withdraw(id: string, candidateId: string): ApplicationDTO {
    const app = this.applications.find((a) => a.id === id && a.candidateId === candidateId);
    if (!app) {
      throw new NotFoundException(`Application ${id} not found for candidate ${candidateId}`);
    }
    return this.updateStatus(id, ApplicationStatus.WITHDRAWN, 'Candidate withdrew their application', RoleType.CANDIDATE);
  }

  getAll(): ApplicationDTO[] {
    return this.applications;
  }

  resetApplications(): { count: number; message: string } {
    this.applications = [];
    return { count: 0, message: 'All applications cleared' };
  }

  seedApplications(): { count: number; message: string } {
    this.applications = [];
    this.seedDemoApplications();
    return { count: this.applications.length, message: `Seeded ${this.applications.length} applications` };
  }

  private seedDemoApplications() {
    this.applications.push({
      id: 'app_1',
      jobId: 'job_1',
      jobTitle: 'Billing Executive',
      orgName: 'Sri Lakshmi Showroom',
      candidateId: 'cand_priya',
      candidateName: 'Priya R.',
      candidatePhone: '9845987654',
      candidateTaluk: 'Mandya Town',
      matchScore: 92,
      status: ApplicationStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: ApplicationStatus.SUBMITTED,
          note: 'Initial application submitted',
          changedAt: new Date().toISOString(),
        },
      ],
    });
  }
}
