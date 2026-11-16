import { calculateJobMatch } from '../src/matching';

describe('Deterministic Explainable Matching Engine (v1)', () => {
  it('Scenario A: calculates ~92% match for Billing Executive (Sri Lakshmi Showroom)', () => {
    const candidate = {
      skills: ['billing', 'tally', 'customer service', 'ms office'],
      educationLevel: 'B.Com Graduate',
      totalExpYears: 2,
      taluk: 'Mandya Town',
      expectedSalary: 18000,
    };

    const job = {
      requiredSkills: ['billing', 'tally', 'customer service'],
      minEducation: 'PUC / Graduate',
      minExpYears: 1,
      taluk: 'Mandya Town',
      salaryMin: 15000,
      salaryMax: 20000,
    };

    const result = calculateJobMatch(candidate, job);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.score).toBeLessThanOrEqual(95);
    expect(result.reasons[0]).toContain('Matches: billing, tally, customer service');
    expect(result.isEligible).toBe(true);
  });

  it('Scenario B: calculates ~78% match for Front Desk Associate (Green Leaf Hotel)', () => {
    const candidate = {
      skills: ['customer service', 'english'],
      educationLevel: 'PUC',
      totalExpYears: 1,
      taluk: 'Mandya Town',
      expectedSalary: 16000,
    };

    const job = {
      requiredSkills: ['customer service', 'english', 'hotel desk software'],
      minEducation: 'PUC',
      minExpYears: 1,
      taluk: 'Mandya Town',
      salaryMin: 14000,
      salaryMax: 18000,
    };

    const result = calculateJobMatch(candidate, job);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.score).toBeLessThanOrEqual(82);
    expect(result.reasons[0]).toContain('customer service, english');
    expect(result.missingSkills).toContain('hotel desk software');
    expect(result.isEligible).toBe(true);
  });

  it('Scenario C: calculates ~34% match for Lab Assistant and NEVER blocks application', () => {
    const candidate = {
      skills: ['customer service', 'billing'],
      educationLevel: 'B.Com',
      totalExpYears: 0,
      taluk: 'Maddur',
      expectedSalary: 25000,
    };

    const job = {
      requiredSkills: ['dmlt', 'pathology testing', 'lab safety'],
      minEducation: 'Diploma in Medical Lab Technology',
      minExpYears: 2,
      taluk: 'Mandya Town',
      salaryMin: 12000,
      salaryMax: 16000,
    };

    const result = calculateJobMatch(candidate, job);
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.missingSkills.length).toBe(3);
    // Crucial rule: low score NEVER sets isEligible to false
    expect(result.isEligible).toBe(true);
  });
});
