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
 * Deterministic Explainable Matching Engine (v1.2)
 * Calibrated against PRD benchmarks:
 * - Scenario A (Billing Executive): ~92%
 * - Scenario B (Front Desk Associate): ~82% (target ~78-82%)
 * - Scenario C (Lab Assistant with B.Com): ~34-35%
 * - Domain-specific qualification matching: Relevant technical/nursing credentials
 *   properly outrank unrelated degrees.
 */
export function calculateJobMatch(
  candidate: MatchingCandidateInput,
  job: MatchingJobInput
): MatchResult {
  const normCandidateSkills = new Set(
    candidate.skills.map((s) => s.trim().toLowerCase())
  );
  const normRequiredSkills = job.requiredSkills.map((s) => s.trim().toLowerCase());
  const normPreferredSkills = (job.preferredSkills || []).map((s) => s.trim().toLowerCase());

  // 1. Skills Scoring (Max 30: 24 required + 6 preferred)
  const matchedRequired: string[] = [];
  const missingSkills: string[] = [];

  for (const rSkill of normRequiredSkills) {
    if (normCandidateSkills.has(rSkill)) {
      matchedRequired.push(rSkill);
    } else {
      missingSkills.push(rSkill);
    }
  }

  const reqSkillRatio =
    normRequiredSkills.length > 0 ? matchedRequired.length / normRequiredSkills.length : 1.0;
  const reqSkillScore = reqSkillRatio * 24;

  let prefSkillScore = 0;
  if (normPreferredSkills.length > 0) {
    const matchedPreferred = normPreferredSkills.filter((s) => normCandidateSkills.has(s));
    prefSkillScore = (matchedPreferred.length / normPreferredSkills.length) * 6;
  } else {
    prefSkillScore = reqSkillRatio * 6;
  }

  const skillScore = reqSkillScore + prefSkillScore;

  // 2. Qualification Scoring (Max 25) with Job-Specific Domain Comparison
  let qualScore = 18;
  if (job.minEducation && candidate.educationLevel) {
    const jobEd = job.minEducation.toLowerCase();
    const candEd = candidate.educationLevel.toLowerCase();

    // Check specific professional domains
    const isMedicalJob =
      jobEd.includes('nurs') ||
      jobEd.includes('gnm') ||
      jobEd.includes('dmlt') ||
      jobEd.includes('mbbs') ||
      jobEd.includes('pharm');
    const isEducationJob =
      jobEd.includes('b.ed') || jobEd.includes('d.ed') || jobEd.includes('teacher');
    const isFinanceJob =
      jobEd.includes('b.com') ||
      jobEd.includes('m.com') ||
      jobEd.includes('ca ') ||
      jobEd.includes('accounts');

    if (isMedicalJob) {
      const isMedicalCandidate =
        candEd.includes('nurs') ||
        candEd.includes('gnm') ||
        candEd.includes('anm') ||
        candEd.includes('dmlt') ||
        candEd.includes('pharm') ||
        candEd.includes('mbbs') ||
        (candEd.includes('diploma') &&
          (candEd.includes('nurs') ||
            candEd.includes('medical') ||
            candEd.includes('health') ||
            candEd.includes('clinical')));

      if (isMedicalCandidate) {
        qualScore = 25; // Exact professional medical qualification match
      } else {
        qualScore = 10; // Unrelated degree/diploma (e.g. Mechanical, Commerce) for specialized medical role
      }
    } else if (isEducationJob) {
      if (candEd.includes('b.ed') || candEd.includes('d.ed')) {
        qualScore = 25;
      } else if (
        candEd.includes('graduate') ||
        candEd.includes('degree') ||
        candEd.includes('b.sc')
      ) {
        qualScore = 18;
      } else {
        qualScore = 12;
      }
    } else if (isFinanceJob) {
      if (candEd.includes('b.com') || candEd.includes('m.com') || candEd.includes('ca')) {
        qualScore = 25;
      } else if (candEd.includes('graduate') || candEd.includes('degree')) {
        qualScore = 20;
      } else {
        qualScore = 14;
      }
    } else {
      // General commercial / retail / showroom / hospitality vacancies
      if (jobEd.includes('graduate') || jobEd.includes('degree')) {
        if (
          candEd.includes('graduate') ||
          candEd.includes('degree') ||
          candEd.includes('b.com') ||
          candEd.includes('b.sc') ||
          candEd.includes('b.a')
        ) {
          qualScore = 24;
        } else if (candEd.includes('puc') || candEd.includes('12th')) {
          qualScore = 18;
        } else {
          qualScore = 14;
        }
      } else if (jobEd.includes('puc')) {
        if (
          candEd.includes('graduate') ||
          candEd.includes('degree') ||
          candEd.includes('b.com')
        ) {
          qualScore = 22;
        } else if (candEd.includes('puc') || candEd.includes('12th')) {
          qualScore = 20;
        } else {
          qualScore = 14;
        }
      } else {
        qualScore = 20;
      }
    }
  }

  // 3. Experience Scoring (Max 20)
  let expScore = 16;
  if (job.minExpYears > 0) {
    if (candidate.totalExpYears >= job.minExpYears) {
      expScore = 16 + Math.min(4, candidate.totalExpYears * 2);
    } else {
      expScore = Math.max(3, Math.round((candidate.totalExpYears / job.minExpYears) * 14));
    }
  }

  // 4. Location Scoring (Max 15)
  let locScore = 4;
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
      salScore = 9;
    } else {
      salScore = 4;
    }
  }

  const rawTotal = Math.round(skillScore + qualScore + expScore + locScore + salScore);
  const totalScore = Math.min(100, Math.max(10, rawTotal));

  const reasons: string[] = [];
  if (matchedRequired.length > 0) {
    reasons.push(`Matches: ${matchedRequired.join(', ')}`);
  }
  if (locScore === 15) {
    reasons.push(`Located in ${job.taluk}`);
  }

  return {
    score: totalScore,
    reasons,
    missingSkills,
    isEligible: true, // Candidates can apply regardless of score
  };
}
