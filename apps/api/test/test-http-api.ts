/**
 * Mandya Jobs - Live HTTP & End-to-End API Verification Suite
 * Boots the actual compiled NestJS HTTP server and executes real HTTP requests
 * verifying the complete Recruiter -> Moderator -> Candidate -> Recruiter lifecycle.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module';
import { INestApplication } from '@nestjs/common';

let passed = 0;
let total = 0;

function assertHttp(condition: boolean, description: string) {
  total++;
  if (!condition) {
    console.error(`❌ HTTP E2E FAILED: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  } else {
    passed++;
    console.log(`✅ HTTP E2E PASS: ${description}`);
  }
}

export async function runLiveHttpE2ESuite() {
  console.log('================================================================');
  console.log('🌐 BOOTING NESTJS LIVE HTTP API & EXECUTING END-TO-END TESTS');
  console.log('================================================================\n');

  const PORT = 4055;
  const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

  // 1. Boot NestJS Application
  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  await app.listen(PORT);
  console.log(`🚀 NestJS server successfully running on ${BASE_URL}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Health & Readiness Probe
    // -------------------------------------------------------------------------
    console.log('🏥 SUITE 1: System Health & Readiness');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assertHttp(healthRes.status === 200, 'GET /api/v1/health returns HTTP 200 OK');
    const healthData = await healthRes.json();
    assertHttp(healthData.status === 'ok', 'Health status reports "ok"');
    assertHttp(healthData.service === 'mandya-jobs-api', 'Identifies as mandya-jobs-api');
    assertHttp(healthData.features.matchingEngine === 'deterministic-v1.2', 'Uses deterministic-v1.2 matching engine');

    // -------------------------------------------------------------------------
    // TEST 2: Public Job Discovery & Clean Startup Verification
    // -------------------------------------------------------------------------
    console.log('\n🔍 SUITE 2: Public Job Discovery & Filtering');
    await fetch(`${BASE_URL}/jobs/reset`, { method: 'POST' });
    const cleanJobsRes = await fetch(`${BASE_URL}/jobs`);
    assertHttp(cleanJobsRes.status === 200, 'GET /api/v1/jobs returns HTTP 200');
    const cleanJobs = await cleanJobsRes.json();
    assertHttp(Array.isArray(cleanJobs) && cleanJobs.length === 0, 'Clean initial startup returns exactly 0 operational vacancies by default');

    // Seed verified vacancies explicitly
    const seedRes = await fetch(`${BASE_URL}/jobs/seed`, { method: 'POST' });
    assertHttp(seedRes.status === 201 || seedRes.status === 200, 'POST /api/v1/jobs/seed succeeds');

    const initialJobsRes = await fetch(`${BASE_URL}/jobs`);
    const initialJobs = await initialJobsRes.json();
    assertHttp(Array.isArray(initialJobs), 'Returns array of published vacancies');
    assertHttp(initialJobs.length >= 8, `Found ${initialJobs.length} active verified vacancies in Mandya`);
    assertHttp(initialJobs.every((j: any) => j.status === 'PUBLISHED'), 'All public listings have status PUBLISHED');
    assertHttp(initialJobs.every((j: any) => j.orgVerified === true), 'All public listings belong to verified employers');

    // Filter by Walk-in
    const walkInRes = await fetch(`${BASE_URL}/jobs?isWalkIn=true`);
    const walkInJobs = await walkInRes.json();
    assertHttp(walkInJobs.length >= 4, `Walk-in filter returns ${walkInJobs.length} walk-in hiring drives`);
    assertHttp(walkInJobs.every((j: any) => j.isWalkIn === true), 'All filtered jobs are walk-in drives');

    // Filter by Taluk: Maddur
    const maddurRes = await fetch(`${BASE_URL}/jobs?taluk=Maddur`);
    const maddurJobs = await maddurRes.json();
    assertHttp(maddurJobs.length >= 2, `Found ${maddurJobs.length} vacancies in Maddur taluk`);
    assertHttp(maddurJobs.every((j: any) => j.taluk.toLowerCase() === 'maddur'), 'All jobs located in Maddur');

    // -------------------------------------------------------------------------
    // TEST 3: Recruiter Post -> Moderation Workflow
    // -------------------------------------------------------------------------
    console.log('\n🏢 SUITE 3: Recruiter Draft Creation & Submission');
    const draftPayload = {
      title: 'Solar Inverter Field Technician',
      orgName: 'Surya Solar Systems Mandya',
      orgBusinessType: 'Showroom',
      taluk: 'Mandya Town',
      salaryMin: 18000,
      salaryMax: 24000,
      requiredSkills: ['solar installation', 'electrical wiring', 'inverter troubleshooting'],
      minExpYears: 1,
      minEducation: 'ITI Electrical / Diploma',
      isWalkIn: true,
      walkInVenue: 'Surya Solar Office, Bangalore-Mysore Highway, Mandya',
    };

    const draftRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftPayload),
    });
    assertHttp(draftRes.status === 201, 'POST /api/v1/jobs returns HTTP 201 Created');
    const draftJob = await draftRes.json();
    assertHttp(draftJob.status === 'DRAFT', 'Job is initially created in DRAFT state');
    assertHttp(draftJob.title === draftPayload.title, 'Job title matches payload');

    // Submit for moderation review
    const submitRes = await fetch(`${BASE_URL}/jobs/${draftJob.id}/submit`, {
      method: 'POST',
    });
    assertHttp(submitRes.status === 201, 'POST /api/v1/jobs/:id/submit returns HTTP 201');
    const submittedJob = await submitRes.json();
    assertHttp(submittedJob.status === 'SUBMITTED', 'Job status transitions to SUBMITTED');

    // Verify unapproved job is NOT in public search
    const checkPublicRes = await fetch(`${BASE_URL}/jobs`);
    const checkPublic = await checkPublicRes.json();
    assertHttp(!checkPublic.some((j: any) => j.id === draftJob.id), 'Unapproved draft remains strictly HIDDEN from public candidates');

    // -------------------------------------------------------------------------
    // TEST 4: Admin Moderator Review & Publication
    // -------------------------------------------------------------------------
    console.log('\n🛡️ SUITE 4: Admin Moderation & Approval');
    
    // Step 4.1: Unauthenticated request to moderation queue must be DENIED (HTTP 401)
    const unauthQueueRes = await fetch(`${BASE_URL}/jobs/moderation/queue`);
    assertHttp(unauthQueueRes.status === 401, 'Unauthenticated moderation queue request rejected with HTTP 401');

    // Step 4.2: Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: '9999' }),
    });
    assertHttp(adminLoginRes.status === 200, 'POST /api/v1/auth/admin-login returns HTTP 200');
    const { token: adminToken } = await adminLoginRes.json();
    assertHttp(Boolean(adminToken), 'Admin receives valid JWT bearer session');

    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // Step 4.3: Authenticated access to queue
    const queueRes = await fetch(`${BASE_URL}/jobs/moderation/queue`, { headers: adminHeaders });
    const queue = await queueRes.json();
    assertHttp(queue.some((j: any) => j.id === draftJob.id), 'Moderator queue contains submitted solar technician vacancy');

    // Step 4.4: Unauthenticated attempt to moderate must fail with 401
    const unauthModRes = await fetch(`${BASE_URL}/jobs/${draftJob.id}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    assertHttp(unauthModRes.status === 401, 'Unauthenticated moderate action blocked with HTTP 401');

    // Step 4.5: Approval BEFORE employer verification must fail with HTTP 400
    const prematureApproveRes = await fetch(`${BASE_URL}/jobs/${draftJob.id}/moderate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'APPROVE',
        reason: 'Attempting to approve unverified employer',
      }),
    });
    assertHttp(prematureApproveRes.status === 400, 'Approval blocked before employer verification with HTTP 400');

    // Step 4.6: Verify employer first
    const verifyEmpRes = await fetch(`${BASE_URL}/jobs/${draftJob.id}/verify-employer`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ reviewerId: 'admin_officer_1' }),
    });
    assertHttp(verifyEmpRes.status === 201, 'POST /jobs/:id/verify-employer returns HTTP 201');
    const verifiedJob = await verifyEmpRes.json();
    assertHttp(verifiedJob.orgVerified === true, 'Employer verified status is active');

    // Step 4.7: Moderator approves the verified job
    const approveRes = await fetch(`${BASE_URL}/jobs/${draftJob.id}/moderate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'APPROVE',
        reason: 'Legitimate local solar business entity verified with trade license.',
        reviewerId: 'admin_moderator_1',
      }),
    });
    assertHttp(approveRes.status === 201, 'POST /api/v1/jobs/:id/moderate returns HTTP 201');
    const approvedJob = await approveRes.json();
    assertHttp(approvedJob.status === 'PUBLISHED', 'Approved vacancy transitions to PUBLISHED');
    assertHttp(approvedJob.moderationHistory.length > 0, 'Moderation audit history recorded');
    assertHttp(approvedJob.moderationHistory.some((m: any) => m.reason && m.reason.includes('trade license')), 'Moderator reason saved in audit history');

    // Step 4.8: Verify job IS public and discoverable
    const publishedCheckRes = await fetch(`${BASE_URL}/jobs`);
    const publishedCheck = await publishedCheckRes.json();
    assertHttp(publishedCheck.some((j: any) => j.id === draftJob.id), 'Approved vacancy is immediately discoverable in public search');

    // Step 4.9: Privacy assertion - private poster contacts must NOT be exposed in public API
    const publicJobRecord = publishedCheck.find((j: any) => j.id === draftJob.id);
    assertHttp(publicJobRecord.posterContactName === undefined, 'Public listing strips private posterContactName');
    assertHttp(publicJobRecord.posterContactPhone === undefined, 'Public listing strips private posterContactPhone');
    assertHttp(publicJobRecord.posterContactEmail === undefined, 'Public listing strips private posterContactEmail');

    // -------------------------------------------------------------------------
    // TEST 5: Candidate Apply & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log('\n👤 SUITE 5: Candidate Application & Duplicate Protection');
    const candidateData = {
      id: 'cand_ravi_kumar',
      name: 'Ravi Kumar M.',
      phone: '9845112233',
      taluk: 'Mandya Town',
      matchScore: 94,
    };

    const applyRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: draftJob.id,
        candidate: candidateData,
        coverNote: 'Hold ITI Electrical certification with 1 year rooftop solar installation experience.',
      }),
    });
    assertHttp(applyRes.status === 201, 'POST /api/v1/applications returns HTTP 201 Created');
    const application = await applyRes.json();
    assertHttp(application.status === 'SUBMITTED', 'Application initial status is SUBMITTED');
    assertHttp(application.jobTitle === draftPayload.title, 'Application bound to exact real job title');
    assertHttp(application.orgName === draftPayload.orgName, 'Application bound to exact organization name');

    // Attempt duplicate application
    const duplicateRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: draftJob.id,
        candidate: candidateData,
      }),
    });
    assertHttp(duplicateRes.status === 400, 'Duplicate active application rejected with HTTP 400 Bad Request');
    const duplicateErr = await duplicateRes.json();
    assertHttp(duplicateErr.message.includes('already applied') || duplicateErr.message.includes('active application'), 'Error message clarifies active application exists');

    // -------------------------------------------------------------------------
    // TEST 6: Recruiter Pipeline & Interview Scheduling
    // -------------------------------------------------------------------------
    console.log('\n📅 SUITE 6: Recruiter Pipeline, Shortlisting & Interviews');
    const applicantsRes = await fetch(`${BASE_URL}/applications/job/${draftJob.id}`);
    const applicants = await applicantsRes.json();
    assertHttp(applicants.length === 1, 'Recruiter sees exactly 1 applicant for solar vacancy');
    assertHttp(applicants[0].candidateName === candidateData.name, 'Applicant name matches Ravi Kumar M.');

    // Recruiter shortlists
    const shortlistRes = await fetch(`${BASE_URL}/applications/${application.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SHORTLISTED', note: 'Strong ITI electrical background' }),
    });
    assertHttp(shortlistRes.status === 200, 'PATCH status to SHORTLISTED returns HTTP 200');
    const shortlisted = await shortlistRes.json();
    assertHttp(shortlisted.status === 'SHORTLISTED', 'Status updated to SHORTLISTED');

    // Recruiter schedules interview
    const interviewPayload = {
      scheduledDate: '2026-11-25 11:00 AM',
      venueOrLink: 'Surya Solar Office, Highway Road, Mandya',
      instructions: 'Please bring ITI diploma certificate and Aadhaar card copy.',
    };
    const interviewRes = await fetch(`${BASE_URL}/applications/${application.id}/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interviewPayload),
    });
    assertHttp(interviewRes.status === 201, 'POST interview scheduling returns HTTP 201');
    const interviewApp = await interviewRes.json();
    assertHttp(interviewApp.status === 'INTERVIEW_SCHEDULED', 'Status transitions to INTERVIEW_SCHEDULED');
    assertHttp(interviewApp.interview.venueOrLink.includes('Mandya'), 'Interview venue recorded accurately');

    // Candidate verifies their tracker
    const candidateAppsRes = await fetch(`${BASE_URL}/applications/candidate/${candidateData.id}`);
    const candidateApps = await candidateAppsRes.json();
    assertHttp(candidateApps.length === 1, 'Candidate sees their active application in tracker');
    assertHttp(candidateApps[0].status === 'INTERVIEW_SCHEDULED', 'Candidate sees INTERVIEW_SCHEDULED status');
    assertHttp(candidateApps[0].interview.scheduledDate === interviewPayload.scheduledDate, 'Candidate sees exact interview date & time');

    // -------------------------------------------------------------------------
    // TEST 7: Candidate Withdrawal
    // -------------------------------------------------------------------------
    console.log('\n🔄 SUITE 7: Candidate Withdrawal Flow');
    const withdrawRes = await fetch(`${BASE_URL}/applications/${application.id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: candidateData.id }),
    });
    assertHttp(withdrawRes.status === 201, 'POST /applications/:id/withdraw returns HTTP 201');
    const withdrawnApp = await withdrawRes.json();
    assertHttp(withdrawnApp.status === 'WITHDRAWN', 'Status updated to WITHDRAWN');

    // Verify candidate can re-apply after withdrawal per PRD
    const reapplyRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: draftJob.id,
        candidate: candidateData,
        coverNote: 'Re-applying with updated contact preferences.',
      }),
    });
    assertHttp(reapplyRes.status === 201, 'Candidate successfully re-applies after withdrawal per PRD one-active rule');

    // -------------------------------------------------------------------------
    // TEST 8: Anti-Scam Moderation Rejection
    // -------------------------------------------------------------------------
    console.log('\n🚫 SUITE 8: Anti-Fraud Enforcement & Scam Rejection');
    const rejectScamRes = await fetch(`${BASE_URL}/jobs/job_scam_test/moderate`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        action: 'REJECT',
        reason: 'Violates candidate free-access policy by demanding registration fee.',
        reviewerId: 'admin_trust_safety',
      }),
    });
    assertHttp(rejectScamRes.status === 201, 'Moderator rejects scam posting');
    const rejectedJob = await rejectScamRes.json();
    assertHttp(rejectedJob.status === 'REJECTED', 'Job status set to REJECTED');

    const finalPublicCheckRes = await fetch(`${BASE_URL}/jobs`);
    const finalPublic = await finalPublicCheckRes.json();
    assertHttp(!finalPublic.some((j: any) => j.id === 'job_scam_test'), 'Rejected scam job is strictly HIDDEN from public candidates');

    console.log('\n================================================================');
    console.log(`🏆 ALL LIVE HTTP API SCENARIOS PASSED: ${passed}/${total} (100% SUCCESS)`);
    console.log('================================================================\n');
  } finally {
    await app.close();
    console.log('🛑 NestJS test server closed cleanly.');
  }
}

if (require.main === module) {
  runLiveHttpE2ESuite().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
