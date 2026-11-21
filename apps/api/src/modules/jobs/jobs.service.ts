import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JobDTO, JobStatus, JobFilterParams } from '@mandya-jobs/types';
import { calculateJobMatch } from '@mandya-jobs/validation';
import { MANDYA_SEED_JOBS } from '@mandya-jobs/validation';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JobsService {
  private jobs: JobDTO[] = [];
  private nextId = 100;
  private storageDir: string;
  private storageFile: string;

  constructor() {
    this.storageDir = process.env.DATA_DIR || path.join(__dirname, '../../../data');
    this.storageFile = path.join(this.storageDir, 'jobs.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        this.jobs = JSON.parse(raw);
      } else {
        this.jobs = [];
      }
    } catch (err) {
      this.jobs = [];
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      fs.writeFileSync(this.storageFile, JSON.stringify(this.jobs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write jobs to disk:', err);
    }
  }

  private toPublicProjection(job: JobDTO): JobDTO {
    const publicJob: any = {
      id: job.id,
      orgId: job.orgId,
      orgName: job.orgName,
      orgBusinessType: job.orgBusinessType,
      orgVerified: job.orgVerified,
      categoryId: job.categoryId,
      categoryName: job.categoryName,
      title: job.title,
      employmentType: job.employmentType,
      workMode: job.workMode,
      taluk: job.taluk,
      addressDisplay: job.addressDisplay,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryPeriod: job.salaryPeriod,
      isNegotiable: job.isNegotiable,
      minExpYears: job.minExpYears,
      minEducation: job.minEducation,
      specificCredential: job.specificCredential,
      openings: job.openings,
      description: job.description,
      benefits: job.benefits,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      isWalkIn: job.isWalkIn,
      walkInDates: job.walkInDates,
      walkInTimings: job.walkInTimings,
      walkInVenue: job.walkInVenue,
      applicationRoute: job.applicationRoute,
      status: job.status,
      createdAt: job.createdAt,
      expiresAt: job.expiresAt,
      match: job.match,
    };

    // Expose application phone strictly when route is PHONE_CALL
    if (job.applicationRoute === 'PHONE_CALL' && job.contactPhone) {
      publicJob.contactPhone = job.contactPhone;
    }

    // Expose external application URL strictly when route is EXTERNAL_URL
    if (job.applicationRoute === 'EXTERNAL_URL' && job.externalApplicationUrl) {
      publicJob.externalApplicationUrl = job.externalApplicationUrl;
    }

    return publicJob as JobDTO;
  }

  resetJobs(): { count: number; message: string } {
    this.jobs = [];
    this.saveToDisk();
    return { count: 0, message: 'All job records cleared' };
  }

  seedJobs(): { count: number; message: string } {
    this.jobs = JSON.parse(JSON.stringify(MANDYA_SEED_JOBS));
    this.saveToDisk();
    return { count: this.jobs.length, message: `Seeded ${this.jobs.length} verified jobs` };
  }

  getAllPublished(filters?: JobFilterParams, candidateProfile?: any): JobDTO[] {
    const now = new Date();
    let result = this.jobs.filter(
      (j) =>
        j.status === JobStatus.PUBLISHED &&
        j.orgVerified === true &&
        (!j.expiresAt || new Date(j.expiresAt) > now)
    );

    if (filters?.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.orgName.toLowerCase().includes(q) ||
          j.taluk.toLowerCase().includes(q) ||
          (j.requiredSkills && j.requiredSkills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    if (filters?.taluk && filters.taluk !== 'ALL') {
      result = result.filter((j) => j.taluk.toLowerCase() === filters.taluk?.toLowerCase());
    }

    if (filters?.category) {
      result = result.filter((j) => j.categoryId === filters.category);
    }

    if (filters?.isWalkIn !== undefined) {
      const walkInBool = String(filters.isWalkIn) === 'true';
      result = result.filter((j) => j.isWalkIn === walkInBool);
    }

    if (filters?.salaryMin) {
      result = result.filter((j) => !j.salaryMax || j.salaryMax >= (filters.salaryMin || 0));
    }

    return result.map((job) => {
      let match = undefined;
      if (candidateProfile) {
        match = calculateJobMatch(
          {
            skills: candidateProfile.skills || [],
            educationLevel: candidateProfile.educationLevel,
            totalExpYears: candidateProfile.totalExpYears || 0,
            taluk: candidateProfile.currentTaluk,
            expectedSalary: candidateProfile.expectedSalary,
          },
          {
            requiredSkills: job.requiredSkills || [],
            preferredSkills: job.preferredSkills,
            minEducation: job.minEducation,
            minExpYears: job.minExpYears,
            taluk: job.taluk,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
          }
        );
      }
      return this.toPublicProjection({ ...job, match });
    });
  }

  getById(id: string, isPrivileged = false): JobDTO {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const now = new Date();
    const isExpired = job.expiresAt ? new Date(job.expiresAt) <= now : false;

    if (!isPrivileged) {
      if (job.status !== JobStatus.PUBLISHED || !job.orgVerified || isExpired) {
        throw new NotFoundException(`Job with ID ${id} not found or not published`);
      }
      return this.toPublicProjection(job);
    }

    return job;
  }

  getModerationQueue(status?: JobStatus): JobDTO[] {
    if (status) {
      return this.jobs.filter((j) => j.status === status);
    }
    return this.jobs.filter(
      (j) =>
        j.status === JobStatus.SUBMITTED ||
        j.status === JobStatus.UNDER_REVIEW ||
        j.status === JobStatus.CHANGES_REQUESTED ||
        (j.fraudAlerts && j.fraudAlerts.length > 0)
    );
  }

  createDraft(data: Partial<JobDTO>): JobDTO {
    if (data.applicationRoute === 'EXTERNAL_URL' && data.externalApplicationUrl) {
      const url = data.externalApplicationUrl;
      if (!/^https?:\/\//i.test(url)) {
        throw new BadRequestException('A valid web application URL starting with http:// or https:// is required.');
      }
    }

    const id = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const submissionRef = `REF-MDY-${Date.now().toString().slice(-6)}`;

    // Fraud alerts detection on text if present
    const fraudAlerts = [...(data.fraudAlerts || [])];
    if (data.description && /registration fee|security deposit/i.test(data.description)) {
      if (!fraudAlerts.some((f) => f.includes('registration fee'))) {
        fraudAlerts.push('Flagged: "registration fee" (recruitment fee violation)');
      }
    }

    const newJob: JobDTO = {
      id,
      orgId: data.orgId || `org_${Date.now()}`,
      orgName: data.orgName || 'Local Business',
      orgBusinessType: data.orgBusinessType || 'Business',
      orgVerified: false,
      contactVerified: false,
      isGuestSubmission: data.isGuestSubmission ?? true,
      categoryId: data.categoryId || 'other',
      categoryName: data.categoryName || data.orgBusinessType || 'Other',
      title: data.title || 'Untitled Vacancy',
      employmentType: data.employmentType || ('FULL_TIME' as any),
      workMode: data.workMode || ('ON_SITE' as any),
      taluk: data.taluk || 'Mandya Town',
      addressDisplay: data.addressDisplay || `${data.taluk || 'Mandya Town'}, Mandya District`,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryPeriod: data.salaryPeriod || ('MONTHLY' as any),
      isNegotiable: data.isNegotiable || false,
      minExpYears: data.minExpYears ?? 0,
      minEducation: data.minEducation || 'None',
      specificCredential: data.specificCredential,
      applicationRoute: data.applicationRoute || (data.isWalkIn ? 'WALK_IN' : 'MANDYA_JOBS_DIRECT'),
      externalApplicationUrl: data.externalApplicationUrl,
      openings: data.openings || 1,
      description: data.description || '',
      benefits: data.benefits || [],
      requiredSkills: data.requiredSkills || [],
      preferredSkills: data.preferredSkills || [],
      isWalkIn: Boolean(data.isWalkIn || data.applicationRoute === 'WALK_IN'),
      walkInDates: data.walkInDates,
      walkInTimings: data.walkInTimings,
      walkInVenue: data.walkInVenue,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      posterContactName: data.posterContactName,
      posterContactPhone: data.posterContactPhone,
      posterContactEmail: data.posterContactEmail,
      status: JobStatus.DRAFT,
      submissionRef,
      fraudAlerts,
      moderationHistory: [
        {
          reviewerId: 'system',
          action: 'DRAFT_CREATED',
          reason: 'Vacancy draft initiated',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.jobs.push(newJob);
    this.saveToDisk();
    return newJob;
  }

  submitForReview(id: string): JobDTO {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    job.status = JobStatus.SUBMITTED;
    job.moderationHistory = job.moderationHistory || [];
    job.moderationHistory.push({
      reviewerId: 'guest_poster',
      action: 'SUBMITTED_FOR_REVIEW',
      reason: 'Submitted by employer for verification and publication',
      timestamp: new Date().toISOString(),
    });
    this.saveToDisk();
    return job;
  }

  verifyEmployer(id: string, reviewerId = 'admin_moderator'): JobDTO {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    job.orgVerified = true;
    job.contactVerified = true;
    job.moderationHistory = job.moderationHistory || [];
    job.moderationHistory.push({
      reviewerId,
      action: 'VERIFY_EMPLOYER',
      reason: 'Employer identity and contact details verified with trade registration',
      timestamp: new Date().toISOString(),
    });
    this.saveToDisk();
    return job;
  }

  moderateJob(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY_EMPLOYER' | 'CLOSE',
    reason?: string,
    reviewerId: string = 'admin_moderator'
  ): JobDTO {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const fromStatus = job.status;
    let toStatus = job.status;

    if (action === 'VERIFY_EMPLOYER') {
      job.orgVerified = true;
      job.contactVerified = true;
    } else if (action === 'APPROVE') {
      if (!job.orgVerified) {
        throw new BadRequestException('Employer and contact verification must be completed before publication');
      }
      job.status = JobStatus.PUBLISHED;
      toStatus = JobStatus.PUBLISHED;
    } else if (action === 'REJECT') {
      job.status = JobStatus.REJECTED;
      toStatus = JobStatus.REJECTED;
    } else if (action === 'REQUEST_CHANGES') {
      job.status = JobStatus.CHANGES_REQUESTED;
      toStatus = JobStatus.CHANGES_REQUESTED;
    } else if (action === 'CLOSE') {
      job.status = JobStatus.CLOSED;
      toStatus = JobStatus.CLOSED;
    }

    job.moderationHistory = job.moderationHistory || [];
    job.moderationHistory.push({
      reviewerId,
      action,
      reason: reason || (action === 'APPROVE' ? 'Approved by moderator' : 'Moderation action taken'),
      timestamp: new Date().toISOString(),
    });

    this.saveToDisk();
    return job;
  }
}
