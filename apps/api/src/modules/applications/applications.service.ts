import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApplicationDTO, ApplicationStatus, RoleType } from '@mandya-jobs/types';
import { JobsService } from '../jobs/jobs.service';
import * as fs from 'fs';
import * as path from 'path';

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
  private storageDir: string;
  private storageFile: string;

  constructor(private readonly jobsService?: JobsService) {
    this.storageDir = process.env.DATA_DIR || path.join(__dirname, '../../../data');
    this.storageFile = path.join(this.storageDir, 'applications.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        this.applications = JSON.parse(raw);
      } else {
        this.applications = [];
      }
    } catch {
      this.applications = [];
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this.applications, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write applications to disk:', err);
    }
  }

  apply(
    jobId: string,
    candidate: { id: string; name: string; phone: string; taluk?: string; matchScore?: number; resumeUrl?: string },
    coverNote?: string
  ): ApplicationDTO {
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

    // Check duplicate active application (PRD: one active application per job; allow re-apply if withdrawn)
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
      resumeUrl: candidate.resumeUrl,
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
    this.saveToDisk();
    return application;
  }

  getByCandidate(candidateId: string): ApplicationDTO[] {
    return this.applications.filter((a) => a.candidateId === candidateId);
  }

  getByJob(jobId: string, requesterOrgId?: string): ApplicationDTO[] {
    const list = this.applications.filter((a) => a.jobId === jobId);
    if (requesterOrgId && this.jobsService) {
      const job = this.jobsService.getById(jobId, true);
      if (job.orgId !== requesterOrgId) {
        throw new ForbiddenException('You do not have access to applicants for this vacancy');
      }
    }
    return list;
  }

  getById(id: string): ApplicationDTO {
    const app = this.applications.find((a) => a.id === id);
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return app;
  }

  updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    note?: string,
    actorRole?: RoleType
  ): ApplicationDTO {
    const app = this.getById(id);
    const allowed = ALLOWED_TRANSITIONS[app.status] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${app.status} to ${newStatus}. Permitted next states: [${allowed.join(', ')}]`
      );
    }

    if (newStatus === ApplicationStatus.WITHDRAWN && actorRole && actorRole !== RoleType.CANDIDATE && actorRole !== RoleType.SUPER_ADMIN) {
      throw new ForbiddenException('Only candidates can withdraw their application');
    }

    app.status = newStatus;
    app.statusHistory.push({
      status: newStatus,
      note: note || `Status updated to ${newStatus}`,
      changedAt: new Date().toISOString(),
    });

    this.saveToDisk();
    return app;
  }

  scheduleInterview(
    id: string,
    details: { scheduledDate: string; venueOrLink: string; instructions?: string }
  ): ApplicationDTO {
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
    this.saveToDisk();
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
    this.saveToDisk();
    return { count: 0, message: 'All applications cleared' };
  }

  seedApplications(): { count: number; message: string } {
    this.applications = [];
    this.seedDemoApplications();
    this.saveToDisk();
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
