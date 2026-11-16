import { MatchResult } from '@mandya-jobs/types';

export interface MatchingCandidateInput {
  skills: string[];
  educationLevel?: string;
  totalExpYears: number;
  taluk?: string;
  expectedSalary?: number;
}

export interface MatchingJobInput {
  requiredSkills: string[];
  preferredSkills?: string[];
  minEducation?: string;
  minExpYears: number;
  taluk: string;
  salaryMin?: number;
  salaryMax?: number;
}

/**
 * Deterministic Explainable Matching Engine (v1)
 * Weights:
 * - Skills: 30%
 * - Qualification: 25%
 * - Experience: 20%
 * - Location: 15%
 * - Salary / Preferences: 10%
 */
export function calculateJobMatch(
  candidate: MatchingCandidateInput,
  job: MatchingJobInput
): MatchResult {
  const normCandidateSkills = new Set(
    candidate.skills.map((s) => s.trim().toLowerCase())
  );
  const normRequiredSkills = job.requiredSkills.map((s) => s.trim().toLowerCase());

  // 1. Skills Scoring (Max 30)
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const rSkill of normRequiredSkills) {
    if (normCandidateSkills.has(rSkill)) {
      matchedSkills.push(rSkill);
    } else {
      missingSkills.push(rSkill);
    }
  }

  const skillScore =
    normRequiredSkills.length > 0
      ? (matchedSkills.length / normRequiredSkills.length) * 30
      : 30;

  // 2. Qualification Scoring (Max 25)
  let qualScore = 15; // Baseline for unspecified
  if (job.minEducation && candidate.educationLevel) {
    qualScore = 25;
  } else if (!job.minEducation) {
    qualScore = 25;
  }

  // 3. Experience Scoring (Max 20)
  let expScore = 20;
  if (job.minExpYears > 0) {
    if (candidate.totalExpYears >= job.minExpYears) {
      expScore = 20;
    } else {
      expScore = Math.max(5, Math.round((candidate.totalExpYears / job.minExpYears) * 20));
    }
  }

  // 4. Location Scoring (Max 15)
  let locScore = 5;
  if (
    candidate.taluk &&
    job.taluk &&
    candidate.taluk.trim().toLowerCase() === job.taluk.trim().toLowerCase()
  ) {
    locScore = 15;
  }

  // 5. Salary Match (Max 10)
  let salScore = 8;
  if (candidate.expectedSalary && job.salaryMax) {
    if (candidate.expectedSalary <= job.salaryMax) {
      salScore = 10;
    } else {
      salScore = 4;
    }
  } else {
    salScore = 10;
  }

  const rawTotal = Math.round(skillScore + qualScore + expScore + locScore + salScore);
  const totalScore = Math.min(100, Math.max(10, rawTotal));

  const reasons: string[] = [];
  if (matchedSkills.length > 0) {
    reasons.push(`Matches: ${matchedSkills.join(', ')}`);
  }
  if (locScore === 15) {
    reasons.push(`Located in ${job.taluk}`);
  }

  return {
    score: totalScore,
    reasons,
    missingSkills,
    isEligible: true, // Candidates are always eligible to apply!
  };
}
