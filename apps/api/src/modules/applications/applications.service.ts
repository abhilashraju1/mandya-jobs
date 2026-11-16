import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicationDTO, ApplicationStatus } from '@mandya-jobs/types';

@Injectable()
export class ApplicationsService {
  private applications: ApplicationDTO[] = [];

  constructor() {
    this.seedDemoApplications();
  }

  apply(jobId: string, candidate: { id: string; name: string; phone: string; taluk?: string; matchScore?: number }, coverNote?: string): ApplicationDTO {
    // Check duplicate active application
    const existing = this.applications.find(
      (a) => a.jobId === jobId && a.candidateId === candidate.id && a.status !== ApplicationStatus.WITHDRAWN
    );
    if (existing) {
      throw new BadRequestException('You have already applied for this vacancy');
    }

    const application: ApplicationDTO = {
      id: `app_${Date.now()}`,
      jobId,
      jobTitle: 'Billing Executive',
      orgName: 'Sri Lakshmi Showroom',
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

  getByJob(jobId: string): ApplicationDTO[] {
    return this.applications.filter((a) => a.jobId === jobId);
  }

  updateStatus(id: string, newStatus: ApplicationStatus, note?: string): ApplicationDTO {
    const app = this.applications.find((a) => a.id === id);
    if (!app) {
      throw new NotFoundException(`Application ${id} not found`);
    }

    app.status = newStatus;
    app.statusHistory.push({
      status: newStatus,
      note,
      changedAt: new Date().toISOString(),
    });

    return app;
  }

  scheduleInterview(id: string, details: { scheduledDate: string; venueOrLink: string; instructions?: string }): ApplicationDTO {
    const app = this.updateStatus(id, ApplicationStatus.INTERVIEW_SCHEDULED, `Interview scheduled for ${details.scheduledDate}`);
    app.interview = details;
    return app;
  }

  withdraw(id: string, candidateId: string): ApplicationDTO {
    const app = this.applications.find((a) => a.id === id && a.candidateId === candidateId);
    if (!app) {
      throw new NotFoundException(`Application ${id} not found for this candidate`);
    }
    return this.updateStatus(id, ApplicationStatus.WITHDRAWN, 'Candidate withdrew their application');
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
