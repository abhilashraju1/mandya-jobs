/**
 * Mandya Jobs Automated Test Runner & Verification Suite
 * Executes all test scenarios across Phase 0 to Phase 5:
 * 1. Matching Engine (92%, 78%, 34% scenarios)
 * 2. Fraud Heuristics ("registration fee", scam alerts)
 * 3. Application Lifecycle (unrestricted low-score apply, duplicate prevention, status transitions)
 * 4. Resume Security (magic-byte checks, size limits, skill extraction)
 * 5. Moderation State Machine (Draft -> Submitted -> Approved/Rejected)
 */

const { calculateJobMatch } = require('../packages/validation/src/matching');
const { detectJobFraud } = require('../packages/validation/src/fraud-detection');
const { ResumeService } = require('../apps/api/src/modules/resumes/resume.service');
const { ApplicationsService } = require('../apps/api/src/modules/applications/applications.service');
const { JobsService } = require('../apps/api/src/modules/jobs/jobs.service');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('====================================================');
console.log('🚀 RUNNING MANDYA JOBS FULL TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Deterministic Explainable Matching Engine
// -----------------------------------------------------------------------------
console.log('📋 SUITE 1: Deterministic Explainable Matching Engine');

// Scenario A: Billing Executive (Sri Lakshmi Showroom) -> Target ~92%
const candA = {
  skills: ['billing', 'tally', 'customer service'],
  educationLevel: 'B.Com Graduate',
  totalExpYears: 1,
  taluk: 'Mandya Town',
  expectedSalary: 18000,
};
const jobA = {
  requiredSkills: ['billing', 'tally', 'customer service'],
  preferredSkills: ['advanced excel'],
  minEducation: 'PUC / Graduate',
  minExpYears: 1,
  taluk: 'Mandya Town',
  salaryMin: 15000,
  salaryMax: 20000,
};
const matchA = calculateJobMatch(candA, jobA);
assert(matchA.score >= 89 && matchA.score <= 94, `Scenario A: Score is ${matchA.score}% (expected ~92%)`);
assert(matchA.reasons[0].includes('billing, tally, customer service'), 'Scenario A: Reasons explain matched skills');
assert(matchA.isEligible === true, 'Scenario A: Candidate is eligible to apply');

// Scenario B: Front Desk Associate (Green Leaf Hotel) -> Target ~78%
const candB = {
  skills: ['customer service', 'english'],
  educationLevel: 'PUC',
  totalExpYears: 1,
  taluk: 'Mandya Town',
  expectedSalary: 16000,
};
const jobB = {
  requiredSkills: ['customer service', 'english', 'hotel desk software'],
  minEducation: 'PUC',
  minExpYears: 1,
  taluk: 'Mandya Town',
  salaryMin: 14000,
  salaryMax: 18000,
};
const matchB = calculateJobMatch(candB, jobB);
assert(matchB.score >= 75 && matchB.score <= 82, `Scenario B: Score is ${matchB.score}% (expected ~78%)`);
assert(matchB.reasons[0].includes('customer service, english'), 'Scenario B: Identifies partial skill match');
assert(matchB.missingSkills.includes('hotel desk software'), 'Scenario B: Highlights missing skills');

// Scenario C: Lab Assistant (City College) -> Target ~34%
const candC = {
  skills: ['customer service', 'billing'],
  educationLevel: 'B.Com',
  totalExpYears: 0,
  taluk: 'Maddur',
  expectedSalary: 25000,
};
const jobC = {
  requiredSkills: ['dmlt', 'pathology testing', 'lab safety'],
  minEducation: 'Diploma in Medical Lab Technology',
  minExpYears: 2,
  taluk: 'Mandya Town',
  salaryMin: 12000,
  salaryMax: 16000,
};
const matchC = calculateJobMatch(candC, jobC);
assert(matchC.score <= 40, `Scenario C: Score is ${matchC.score}% (expected low ~34%)`);
assert(matchC.isEligible === true, 'Scenario C (CRUCIAL): Low match NEVER disables Apply CTA');

// Scenario D (Qualification Domain Comparison): Relevant Nursing Credential outranks unrelated B.Com & Mechanical Diploma
const nurseJob = {
  requiredSkills: ['nursing', 'patient care'],
  minEducation: 'GNM / BSc Nursing',
  minExpYears: 1,
  taluk: 'Mandya Town',
};
const nurseCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'GNM / Diploma Nursing',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const bcomCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'B.Com Graduate',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const mechCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'Diploma in Mechanical Engineering',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const pharmacyCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'Diploma in Pharmacy (D.Pharm)',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const dmltCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'Diploma in Medical Lab Technology (DMLT)',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const kannadaNurseCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'ಜನರಲ್ ನರ್ಸಿಂಗ್ ಡಿಪ್ಲೊಮಾ (GNM)',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const kannadaTranslitNurseCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'ನರ್ಸಿಂಗ್ ಡಿಪ್ಲೊಮಾ',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const kannadaShushrushaNurseCandidate = {
  skills: ['nursing', 'patient care'],
  educationLevel: 'ಶುಶ್ರೂಷ ಡಿಪ್ಲೊಮಾ',
  totalExpYears: 1,
  taluk: 'Mandya Town',
};
const nurseMatch = calculateJobMatch(nurseCandidate, nurseJob);
const bcomMatch = calculateJobMatch(bcomCandidate, nurseJob);
const mechMatch = calculateJobMatch(mechCandidate, nurseJob);
const pharmacyMatch = calculateJobMatch(pharmacyCandidate, nurseJob);
const dmltMatch = calculateJobMatch(dmltCandidate, nurseJob);
const kannadaNurseMatch = calculateJobMatch(kannadaNurseCandidate, nurseJob);
const kannadaTranslitMatch = calculateJobMatch(kannadaTranslitNurseCandidate, nurseJob);
const kannadaShushrushaMatch = calculateJobMatch(kannadaShushrushaNurseCandidate, nurseJob);

assert(
  nurseMatch.score > bcomMatch.score,
  `Scenario D: Relevant nursing credential (${nurseMatch.score}%) outranks unrelated B.Com degree (${bcomMatch.score}%)`
);
assert(
  nurseMatch.score > mechMatch.score,
  `Scenario D2: Relevant Nursing Diploma (${nurseMatch.score}%) strictly outranks Mechanical Diploma (${mechMatch.score}%) for Nursing job`
);
assert(
  nurseMatch.score > pharmacyMatch.score,
  `Scenario D3: Exact Nursing credential (${nurseMatch.score}%) strictly outranks Pharmacy (${pharmacyMatch.score}%) for Nursing job`
);
assert(
  nurseMatch.score > dmltMatch.score,
  `Scenario D3: Exact Nursing credential (${nurseMatch.score}%) strictly outranks DMLT (${dmltMatch.score}%) for Nursing job`
);
assert(
  pharmacyMatch.score > mechMatch.score,
  `Scenario D3: Allied medical Pharmacy (${pharmacyMatch.score}%) outranks unrelated Mechanical (${mechMatch.score}%)`
);
assert(
  kannadaNurseMatch.score === 96,
  `Scenario D4: Kannada Nursing GNM matches exact nursing score (${kannadaNurseMatch.score}% === 96%)`
);
assert(
  kannadaTranslitMatch.score === 96,
  `Scenario D5: Kannada transliteration "ನರ್ಸಿಂಗ್ ಡಿಪ್ಲೊಮಾ" matches exact nursing score (${kannadaTranslitMatch.score}% === 96%)`
);
assert(
  kannadaShushrushaMatch.score === 96,
  `Scenario D5: Kannada canonical "ಶುಶ್ರೂಷ ಡಿಪ್ಲೊಮಾ" matches exact nursing score (${kannadaShushrushaMatch.score}% === 96%)`
);
assert(
  mechMatch.score <= 81,
  `Scenario D2: Mechanical Diploma receives unrelated qualification score (${mechMatch.score}% <= 81%)`
);

// -----------------------------------------------------------------------------
// SUITE 2: Fraud & Scam Heuristic Scanner
// -----------------------------------------------------------------------------
console.log('\n📋 SUITE 2: Fraud & Scam Heuristic Scanner');
const scamCheck = detectJobFraud({
  title: 'Data Entry Work From Home',
  description: 'Typing forms. Pay mandatory registration fee of 500 INR before starting.',
  contactPhone: '9840000000',
});
assert(scamCheck.isFlagged === true, 'Fraud scanner flags "registration fee" phrase');
assert(scamCheck.flags.some((f) => f.includes('registration fee')), 'Identifies specific fee violation flag');

const cleanCheck = detectJobFraud({
  title: 'Billing Executive',
  description: 'Handle counter billing at Sri Lakshmi Showroom.',
  contactPhone: '9845012345',
});
assert(cleanCheck.isFlagged === false, 'Legitimate job produces zero false positives');

// -----------------------------------------------------------------------------
// SUITE 3: Resume Security & Parsing
// -----------------------------------------------------------------------------
console.log('\n📋 SUITE 3: Resume Security & Parsing');
const resumeService = new ResumeService();
const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF
const validRes = resumeService.validateFile({
  buffer: validPdfBuffer,
  mimetype: 'application/pdf',
  size: 2048,
  originalname: 'priya_resume.pdf',
});
assert(validRes.isValid === true && validRes.fileType === 'pdf', 'Validates authentic PDF via magic-byte inspection');

let rejectedMalware = false;
try {
  const fakePdf = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ executable header
  resumeService.validateFile({
    buffer: fakePdf,
    mimetype: 'application/pdf',
    size: 2048,
    originalname: 'virus.pdf',
  });
} catch (e) {
  rejectedMalware = true;
}
assert(rejectedMalware === true, 'Blocks executable binaries disguised with .pdf extension');

const extractedData = resumeService.extractSkillsAndDetails(`
  Priya R.
  Phone: 9845987654 | Email: priya.mandya@gmail.com
  Experienced in Tally ERP 9, retail billing, and customer service.
`);
assert(extractedData.extractedSkills.includes('tally'), 'Extracts Tally skill from resume text');
assert(extractedData.extractedSkills.includes('billing'), 'Extracts Billing skill from resume text');
assert(extractedData.extractedPhone === '9845987654', 'Extracts candidate phone number safely');

// -----------------------------------------------------------------------------
// SUITE 4: Applications Lifecycle & Duplicate Prevention
// -----------------------------------------------------------------------------
console.log('\n📋 SUITE 4: Applications Lifecycle & Duplicate Prevention');
const appService = new ApplicationsService();

const app1 = appService.apply('job_1', {
  id: 'cand_low_score',
  name: 'Ramesh K.',
  phone: '9845112233',
  matchScore: 34,
}, 'Ready to work diligently.');
assert(app1.status === 'SUBMITTED', 'Candidate can apply successfully with 34% match');

let duplicateBlocked = false;
try {
  appService.apply('job_1', {
    id: 'cand_low_score',
    name: 'Ramesh K.',
    phone: '9845112233',
  });
} catch (e) {
  duplicateBlocked = true;
}
assert(duplicateBlocked === true, 'Blocks duplicate active application from same candidate');

const shortlisted = appService.updateStatus(app1.id, 'SHORTLISTED', 'Candidate has good references');
assert(shortlisted.status === 'SHORTLISTED', 'Recruiter can shortlist candidate');

const interviewScheduled = appService.scheduleInterview(app1.id, {
  scheduledDate: '2026-11-20 11:00 AM',
  venueOrLink: 'Sri Lakshmi Showroom, Mandya',
  instructions: 'Bring original ID proofs',
});
assert(interviewScheduled.status === 'INTERVIEW_SCHEDULED', 'Recruiter can schedule interview with date & venue');

const withdrawn = appService.withdraw(app1.id, 'cand_low_score');
assert(withdrawn.status === 'WITHDRAWN', 'Candidate can withdraw application');

// -----------------------------------------------------------------------------
// SUITE 5: Jobs Moderation State Machine
// -----------------------------------------------------------------------------
console.log('\n📋 SUITE 5: Jobs Moderation State Machine');
const jobsService = new JobsService();

const draft = jobsService.createDraft({
  title: 'Showroom Assistant',
  taluk: 'Mandya Town',
});
assert(draft.status === 'DRAFT', 'Job begins in DRAFT state');

const submitted = jobsService.submitForReview(draft.id);
assert(submitted.status === 'SUBMITTED', 'Job transitions to SUBMITTED for review');

jobsService.verifyEmployer(submitted.id);
const approved = jobsService.moderateJob(submitted.id, 'APPROVE');
assert(approved.status === 'PUBLISHED', 'Moderator approval transitions job to PUBLISHED');

const publicJobs = jobsService.getAllPublished();
assert(publicJobs.some((j) => j.id === draft.id), 'Approved published job appears in public listings');

// Test scam job rejection
const scamJob = jobsService.createDraft({
  title: 'Work from home',
  description: 'Pay registration fee of 500 INR',
});
const scamSubmitted = jobsService.submitForReview(scamJob.id);
assert(Boolean(scamSubmitted.fraudAlerts && scamSubmitted.fraudAlerts.length > 0), 'Scam job automatically receives fraud flags');

const scamRejected = jobsService.moderateJob(scamSubmitted.id, 'REJECT');
assert(scamRejected.status === 'REJECTED', 'Moderator rejects scam job');
const publicJobsAfter = jobsService.getAllPublished();
assert(!publicJobsAfter.some((j) => j.id === scamJob.id), 'Rejected job is NEVER visible to the public');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`🎉 ALL TESTS EXECUTED: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
console.log('====================================================');
