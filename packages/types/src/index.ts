export enum RoleType {
  GUEST = 'GUEST',
  CANDIDATE = 'CANDIDATE',
  EMPLOYER_OWNER = 'EMPLOYER_OWNER',
  EMPLOYER_RECRUITER = 'EMPLOYER_RECRUITER',
  MODERATOR = 'MODERATOR',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum OrgVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  WALK_IN = 'WALK_IN',
  INTERNSHIP = 'INTERNSHIP',
  CONTRACT = 'CONTRACT',
}

export enum WorkMode {
  ON_SITE = 'ON_SITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

export enum SalaryPeriod {
  MONTHLY = 'MONTHLY',
  DAILY = 'DAILY',
  HOURLY = 'HOURLY',
  YEARLY = 'YEARLY',
}

export enum ApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  VIEWED = 'VIEWED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEWED = 'INTERVIEWED',
  OFFERED = 'OFFERED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface MatchResult {
  score: number;
  reasons: string[];
  missingSkills: string[];
  isEligible: boolean;
}

export interface MandyaLocality {
  id: string;
  nameEn: string;
  nameKn: string;
  isCity: boolean;
  taluk: string;
}

export interface JobFilterParams {
  q?: string;
  category?: string;
  taluk?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  isWalkIn?: boolean;
  salaryMin?: number;
  minExpYears?: number;
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'newest' | 'salary_high';
}

export interface CandidateProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  headline?: string;
  bio?: string;
  currentTaluk?: string;
  expectedSalary?: number;
  salaryPeriod?: SalaryPeriod;
  isFresher: boolean;
  totalExpMonths: number;
  skills: string[];
  education: Array<{
    id?: string;
    degree: string;
    institution: string;
    passingYear?: number;
    grade?: string;
  }>;
  experience: Array<{
    id?: string;
    companyName: string;
    roleTitle: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
  }>;
  isPublicToRecruiters: boolean;
}

export interface JobDTO {
  id: string;
  orgId: string;
  orgName: string;
  orgBusinessType: string;
  orgVerified: boolean;
  categoryId: string;
  categoryName: string;
  title: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  taluk: string;
  addressDisplay: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod: SalaryPeriod;
  isNegotiable: boolean;
  minExpYears: number;
  minEducation?: string;
  openings: number;
  description: string;
  benefits: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  isWalkIn: boolean;
  walkInDates?: string;
  walkInTimings?: string;
  walkInVenue?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: JobStatus;
  createdAt: string;
  expiresAt?: string;
  match?: MatchResult;
  fraudAlerts?: string[];
  moderationHistory?: Array<{
    reviewerId?: string;
    action: string;
    reason?: string;
    timestamp: string;
  }>;
  version?: number;
  submissionRef?: string;
  isGuestSubmission?: boolean;
  posterContactName?: string;
  applicationRoute?: string;
  specificCredential?: string;
  contactVerified?: boolean;
}

export interface ApplicationDTO {
  id: string;
  jobId: string;
  jobTitle: string;
  orgName: string;
  candidateId: string;
  candidateName: string;
  candidatePhone: string;
  candidateTaluk?: string;
  resumeUrl?: string;
  coverNote?: string;
  matchScore?: number;
  status: ApplicationStatus;
  createdAt: string;
  statusHistory: Array<{
    status: ApplicationStatus;
    note?: string;
    changedAt: string;
  }>;
  interview?: {
    scheduledDate: string;
    venueOrLink: string;
    instructions?: string;
  };
}

export interface ModerationActionDTO {
  jobId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  reasonCode?: string;
  notes?: string;
}
