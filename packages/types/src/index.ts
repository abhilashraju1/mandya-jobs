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
