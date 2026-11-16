import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JobDTO, JobStatus, EmploymentType, WorkMode, SalaryPeriod, JobFilterParams } from '@mandya-jobs/types';
import { calculateJobMatch, detectJobFraud } from '../../../../../packages/validation/src';

@Injectable()
export class JobsService {
  private jobs: JobDTO[] = [];
  private nextId = 100;

  constructor() {
    this.seedInitialJobs();
  }

  getAllPublished(filters?: JobFilterParams, candidateProfile?: any): JobDTO[] {
    let result = this.jobs.filter((j) => j.status === JobStatus.PUBLISHED);

    if (filters?.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.orgName.toLowerCase().includes(q) ||
          j.taluk.toLowerCase().includes(q) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filters?.taluk) {
      result = result.filter((j) => j.taluk.toLowerCase() === filters.taluk?.toLowerCase());
    }

    if (filters?.category) {
      result = result.filter((j) => j.categoryId === filters.category);
    }

    if (filters?.isWalkIn !== undefined) {
      result = result.filter((j) => j.isWalkIn === filters.isWalkIn);
    }

    if (filters?.salaryMin) {
      result = result.filter((j) => !j.salaryMax || j.salaryMax >= (filters.salaryMin || 0));
    }

    // Attach real-time computed match results if candidate profile is provided
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
            requiredSkills: job.requiredSkills,
            minEducation: job.minEducation,
            minExpYears: job.minExpYears,
            taluk: job.taluk,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
          }
        );
      }
      return { ...job, match };
    });
  }

  getById(id: string): JobDTO {
    const job = this.jobs.find((j) => j.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  createDraft(data: Partial<JobDTO>): JobDTO {
    const id = `job_${Date.now()}_${++this.nextId}`;
    const newJob: JobDTO = {
      id,
      orgId: data.orgId || 'org_demo',
      orgName: data.orgName || 'Local Business',
      orgBusinessType: data.orgBusinessType || 'Showroom',
      orgVerified: true,
      categoryId: data.categoryId || 'showrooms',
      categoryName: data.categoryName || 'Retail Showroom',
      title: data.title || 'Untitled Job',
      employmentType: data.employmentType || EmploymentType.FULL_TIME,
      workMode: data.workMode || WorkMode.ON_SITE,
      taluk: data.taluk || 'Mandya Town',
      addressDisplay: data.addressDisplay || 'Mandya, Karnataka',
      salaryMin: data.salaryMin || 15000,
      salaryMax: data.salaryMax || 20000,
      salaryPeriod: data.salaryPeriod || SalaryPeriod.MONTHLY,
      isNegotiable: data.isNegotiable || false,
      minExpYears: data.minExpYears || 0,
      minEducation: data.minEducation || 'PUC',
      openings: data.openings || 1,
      description: data.description || '',
      benefits: data.benefits || ['Provident Fund', 'Incentives'],
      requiredSkills: data.requiredSkills || ['Customer Service'],
      preferredSkills: data.preferredSkills || [],
      isWalkIn: data.isWalkIn || false,
      walkInDates: data.walkInDates,
      walkInTimings: data.walkInTimings,
      walkInVenue: data.walkInVenue,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      status: JobStatus.DRAFT,
      createdAt: new Date().toISOString(),
    };

    this.jobs.push(newJob);
    return newJob;
  }

  submitForReview(id: string): JobDTO {
    const job = this.getById(id);
    job.status = JobStatus.SUBMITTED;

    // Run automated fraud heuristics
    const fraudCheck = detectJobFraud({
      title: job.title,
      description: job.description,
      contactPhone: job.contactPhone,
      contactEmail: job.contactEmail,
    });

    job.fraudAlerts = fraudCheck.flags;
    return job;
  }

  // Admin moderation actions
  getModerationQueue(status?: JobStatus): JobDTO[] {
    if (status) {
      return this.jobs.filter((j) => j.status === status);
    }
    return this.jobs.filter((j) => j.status === JobStatus.SUBMITTED || j.status === JobStatus.UNDER_REVIEW);
  }

  moderateJob(id: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', reason?: string): JobDTO {
    const job = this.getById(id);
    if (action === 'APPROVE') {
      job.status = JobStatus.PUBLISHED;
    } else if (action === 'REJECT') {
      job.status = JobStatus.REJECTED;
    } else if (action === 'REQUEST_CHANGES') {
      job.status = JobStatus.CHANGES_REQUESTED;
    }
    return job;
  }

  private seedInitialJobs() {
    this.jobs = [
      {
        id: 'job_1',
        orgId: 'org_1',
        orgName: 'Sri Lakshmi Showroom',
        orgBusinessType: 'Showroom',
        orgVerified: true,
        categoryId: 'showrooms',
        categoryName: 'Showrooms & Retail',
        title: 'Billing Executive',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Mandya Town',
        addressDisplay: 'VV Road, Mandya Town',
        salaryMin: 15000,
        salaryMax: 20000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: true,
        minExpYears: 1,
        minEducation: 'PUC / Graduate',
        openings: 2,
        description: 'Handle counter billing, POS operations, Tally inventory updates, and customer queries.',
        benefits: ['ESI', 'PF', 'Performance Bonus'],
        requiredSkills: ['billing', 'tally', 'customer service'],
        preferredSkills: ['ms excel'],
        isWalkIn: true,
        walkInDates: 'Mon-Sat (10:00 AM - 1:00 PM)',
        walkInTimings: '10:00 AM - 1:00 PM',
        walkInVenue: 'Sri Lakshmi Showroom, 2nd Floor, VV Road, Mandya',
        contactPhone: '9845012345',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'job_2',
        orgId: 'org_2',
        orgName: 'Green Leaf Hotel',
        orgBusinessType: 'Hotel',
        orgVerified: true,
        categoryId: 'hospitality',
        categoryName: 'Hotels & Restaurants',
        title: 'Front Desk Associate',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Mandya Town',
        addressDisplay: 'Bangalore-Mysore Highway, Mandya',
        salaryMin: 14000,
        salaryMax: 18000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: false,
        minExpYears: 1,
        minEducation: 'PUC',
        openings: 3,
        description: 'Manage guest check-ins, phone reservations, room allocations, and guest support.',
        benefits: ['Duty Meals Provided', 'Uniform Allowance'],
        requiredSkills: ['customer service', 'english', 'hotel desk software'],
        preferredSkills: ['kannada'],
        isWalkIn: false,
        contactPhone: '9845123456',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'job_3',
        orgId: 'org_3',
        orgName: 'Mandya City Diagnostic Center',
        orgBusinessType: 'Hospital/Clinic',
        orgVerified: true,
        categoryId: 'healthcare',
        categoryName: 'Hospitals & Clinics',
        title: 'Lab Assistant',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Mandya Town',
        addressDisplay: 'Opposite District Hospital, Mandya',
        salaryMin: 12000,
        salaryMax: 16000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: false,
        minExpYears: 1,
        minEducation: 'Diploma in MLT',
        openings: 1,
        description: 'Conduct routine blood tests, urine analysis, sample collection, and laboratory sterilisation.',
        benefits: ['Health Insurance', 'Safety Kit'],
        requiredSkills: ['dmlt', 'pathology testing', 'lab safety'],
        preferredSkills: ['computer entry'],
        isWalkIn: true,
        walkInDates: 'Every Wednesday & Friday',
        walkInTimings: '9:00 AM - 12:00 PM',
        walkInVenue: 'Diagnostic Wing, Mandya',
        contactPhone: '9845234567',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'job_scam_test',
        orgId: 'org_unverified',
        orgName: 'QuickEarn Services',
        orgBusinessType: 'Other',
        orgVerified: false,
        categoryId: 'finance-legal',
        categoryName: 'Other',
        title: 'Data Entry Work From Home',
        employmentType: EmploymentType.CONTRACT,
        workMode: WorkMode.REMOTE,
        taluk: 'Mandya Town',
        addressDisplay: 'Remote / Online',
        salaryMin: 30000,
        salaryMax: 45000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: false,
        minExpYears: 0,
        minEducation: 'None',
        openings: 50,
        description: 'Earn 3000 daily typing forms online. Mandatory refundable registration fee of 500 INR before training kit is dispatched.',
        benefits: ['Instant payout'],
        requiredSkills: ['typing'],
        preferredSkills: [],
        isWalkIn: false,
        contactPhone: '9840000000',
        status: JobStatus.SUBMITTED,
        fraudAlerts: [
          'Flagged: "registration fee" (recruitment fee violation)',
          'Suspicious work-from-home salary claim',
        ],
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
