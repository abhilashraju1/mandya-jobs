import { Injectable, NotFoundException } from '@nestjs/common';
import { JobDTO, JobStatus, EmploymentType, WorkMode, SalaryPeriod, JobFilterParams } from '@mandya-jobs/types';
import { calculateJobMatch, detectJobFraud } from '@mandya-jobs/validation';

@Injectable()
export class JobsService {
  private jobs: JobDTO[] = [];
  private nextId = 100;

  constructor() {
    this.seedInitialJobs();
  }

  resetJobs(): { count: number; message: string } {
    this.jobs = [];
    return { count: 0, message: 'All job records cleared' };
  }

  seedJobs(): { count: number; message: string } {
    this.seedInitialJobs();
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
            requiredSkills: job.requiredSkills,
            preferredSkills: job.preferredSkills,
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

    const fraudCheck = detectJobFraud({
      title: job.title,
      description: job.description,
      contactPhone: job.contactPhone,
      contactEmail: job.contactEmail,
    });

    job.fraudAlerts = fraudCheck.flags;
    return job;
  }

  getModerationQueue(status?: JobStatus): JobDTO[] {
    if (status) {
      return this.jobs.filter((j) => j.status === status);
    }
    return this.jobs.filter((j) => j.status === JobStatus.SUBMITTED || j.status === JobStatus.UNDER_REVIEW);
  }

  moderateJob(
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    reason?: string,
    reviewerId: string = 'mod_admin'
  ): JobDTO {
    const job = this.getById(id);
    job.moderationHistory = job.moderationHistory || [];
    job.moderationHistory.push({
      reviewerId,
      action,
      reason: reason || (action === 'APPROVE' ? 'Approved by moderator' : 'No reason provided'),
      timestamp: new Date().toISOString(),
    });

    if (action === 'APPROVE') {
      job.orgVerified = true;
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
      // 1. Retail / Showroom
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
        preferredSkills: ['advanced excel'],
        isWalkIn: true,
        walkInDates: 'Mon-Sat (10:00 AM - 1:00 PM)',
        walkInTimings: '10:00 AM - 1:00 PM',
        walkInVenue: 'Sri Lakshmi Showroom, 2nd Floor, VV Road, Mandya',
        contactPhone: '9845012345',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 2. Hospitality / Hotel
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
        description: 'Manage guest check-ins, reservations, room allocations, and customer support.',
        benefits: ['Duty Meals Provided', 'Uniform Allowance'],
        requiredSkills: ['customer service', 'english', 'hotel desk software'],
        preferredSkills: ['kannada typing'],
        isWalkIn: false,
        contactPhone: '9845123456',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 3. Healthcare / Lab
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
        minExpYears: 2,
        minEducation: 'Diploma in Medical Lab Technology',
        openings: 1,
        description: 'Conduct routine blood tests, urine analysis, sample collection, and equipment sterilization.',
        benefits: ['Health Insurance', 'Safety Kit'],
        requiredSkills: ['dmlt', 'pathology testing', 'lab safety'],
        preferredSkills: ['biochemistry'],
        isWalkIn: true,
        walkInDates: 'Wed & Fri (9:00 AM - 12:00 PM)',
        walkInTimings: '9:00 AM - 12:00 PM',
        walkInVenue: 'Diagnostic Wing, Mandya',
        contactPhone: '9845234567',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 4. Healthcare / Staff Nurse
      {
        id: 'job_4',
        orgId: 'org_4',
        orgName: 'Mandya Sanjeevini Hospital',
        orgBusinessType: 'Hospital',
        orgVerified: true,
        categoryId: 'healthcare',
        categoryName: 'Hospitals & Clinics',
        title: 'Staff Nurse',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Mandya Town',
        addressDisplay: 'Subhash Nagar, Mandya',
        salaryMin: 18000,
        salaryMax: 26000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: true,
        minExpYears: 1,
        minEducation: 'GNM / BSc Nursing',
        openings: 5,
        description: 'Provide inpatient care, medication administration, vitals monitoring, and patient support.',
        benefits: ['PF', 'Night Shift Allowance', 'Medical Benefits'],
        requiredSkills: ['nursing', 'patient care', 'first aid'],
        preferredSkills: ['icu support'],
        isWalkIn: true,
        walkInDates: 'Mon to Fri (11:00 AM - 2:00 PM)',
        walkInTimings: '11:00 AM - 2:00 PM',
        walkInVenue: 'HR Office, Mandya Sanjeevini Hospital',
        contactPhone: '9845345678',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 5. Education / Teacher
      {
        id: 'job_5',
        orgId: 'org_5',
        orgName: 'Rotary English School',
        orgBusinessType: 'School',
        orgVerified: true,
        categoryId: 'education',
        categoryName: 'Schools & Colleges',
        title: 'Primary School Teacher',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Maddur',
        addressDisplay: 'Near Bus Stand, Maddur, Mandya District',
        salaryMin: 16000,
        salaryMax: 22000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: true,
        minExpYears: 1,
        minEducation: 'B.Ed / D.Ed',
        openings: 2,
        description: 'Teach Mathematics and General Science for grades 1-5; conduct activities and tests.',
        benefits: ['PF', 'Free Child Education', 'Annual Paid Leave'],
        requiredSkills: ['teaching', 'mathematics', 'classroom management', 'english'],
        preferredSkills: ['kannada'],
        isWalkIn: false,
        contactPhone: '9845456789',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 6. Finance / CA Accounts Assistant
      {
        id: 'job_6',
        orgId: 'org_6',
        orgName: 'K.S. Rao & Co. Chartered Accountants',
        orgBusinessType: 'Office',
        orgVerified: true,
        categoryId: 'finance-legal',
        categoryName: 'CA, Accounts & Legal',
        title: 'Senior Accounts Assistant',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Mandya Town',
        addressDisplay: 'Court Road, Mandya',
        salaryMin: 18000,
        salaryMax: 25000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: true,
        minExpYears: 2,
        minEducation: 'B.Com / M.Com',
        openings: 2,
        description: 'GST filing, TDS reconciliation, audit preparation, voucher entries, and client compliance.',
        benefits: ['Bonus', 'Overtime Allowance'],
        requiredSkills: ['tally prime', 'gst', 'tds', 'ms excel'],
        preferredSkills: ['busy accounting'],
        isWalkIn: false,
        contactPhone: '9845567890',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 7. Dairy & Agriculture
      {
        id: 'job_7',
        orgId: 'org_7',
        orgName: 'Mandya District Milk Union (MANMUL)',
        orgBusinessType: 'Dairy',
        orgVerified: true,
        categoryId: 'agriculture-dairy',
        categoryName: 'Agriculture & Dairy',
        title: 'Dairy Operations Assistant',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Maddur',
        addressDisplay: 'Gejjalagere Plant, Maddur Taluk',
        salaryMin: 16000,
        salaryMax: 23000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: false,
        minExpYears: 1,
        minEducation: 'ITI / Diploma',
        openings: 6,
        description: 'Supervise milk pasteurisation plant, cold storage monitoring, batch quality logging.',
        benefits: ['Subsidized Canteen', 'Transport Support', 'PF', 'ESI'],
        requiredSkills: ['dairy processing', 'quality testing', 'machine maintenance'],
        preferredSkills: ['refrigeration'],
        isWalkIn: true,
        walkInDates: 'Every Tuesday (10:00 AM - 1:00 PM)',
        walkInTimings: '10:00 AM - 1:00 PM',
        walkInVenue: 'MANMUL Main Gate Training Hall, Gejjalagere',
        contactPhone: '9845678901',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 8. Logistics / Heavy Driving
      {
        id: 'job_8',
        orgId: 'org_8',
        orgName: 'Kaveri Milk Transports',
        orgBusinessType: 'Logistics',
        orgVerified: true,
        categoryId: 'logistics',
        categoryName: 'Driving & Logistics',
        title: 'Commercial Heavy Driver',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Malavalli',
        addressDisplay: 'Malavalli Main Depot, Mandya District',
        salaryMin: 20000,
        salaryMax: 28000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: true,
        minExpYears: 3,
        minEducation: '10th Pass with Valid HMV Badge',
        openings: 4,
        description: 'Daily collection routes from milk chilling centers across Mandya taluks to dairy plants.',
        benefits: ['Trip Bata', 'Accident Insurance', 'PF'],
        requiredSkills: ['heavy driving', 'route navigation', 'vehicle inspection'],
        preferredSkills: ['clean record'],
        isWalkIn: true,
        walkInDates: 'Mon-Fri (9:30 AM - 12:30 PM)',
        walkInTimings: '9:30 AM - 12:30 PM',
        walkInVenue: 'Malavalli Transport Depot',
        contactPhone: '9845789012',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 9. Legal / Legal Office Assistant
      {
        id: 'job_9',
        orgId: 'org_9',
        orgName: 'Advocate M.B. Patel & Associates',
        orgBusinessType: 'Office',
        orgVerified: true,
        categoryId: 'finance-legal',
        categoryName: 'CA, Accounts & Legal',
        title: 'Legal Office Assistant',
        employmentType: EmploymentType.FULL_TIME,
        workMode: WorkMode.ON_SITE,
        taluk: 'Srirangapatna',
        addressDisplay: 'Fort Road, Srirangapatna',
        salaryMin: 14000,
        salaryMax: 18000,
        salaryPeriod: SalaryPeriod.MONTHLY,
        isNegotiable: false,
        minExpYears: 0,
        minEducation: 'PUC / Degree',
        openings: 1,
        description: 'Court case diary scheduling, drafting notice copies, filing papers at taluk magistrate office.',
        benefits: ['Court Learning Experience', 'Annual Increment'],
        requiredSkills: ['kannada typing', 'english typing', 'file management', 'client communication'],
        preferredSkills: ['legal software'],
        isWalkIn: false,
        contactPhone: '9845890123',
        status: JobStatus.PUBLISHED,
        createdAt: new Date().toISOString(),
      },
      // 10. Intentional Suspicious Scam Job (For Moderator Testing)
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
