import { JobDTO, ApplicationDTO, JobFilterParams } from '@mandya-jobs/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function getAdminHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const adminToken = localStorage.getItem('mandya_admin_token');
    const adminKey = localStorage.getItem('mandya_admin_pin') || '9999';
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    headers['x-admin-key'] = adminKey;
  }
  return headers;
}

export async function adminLogin(passcode: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_BASE}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Invalid admin passcode');
  }
  return await res.json();
}

export async function sendOtp(phoneNumber: string): Promise<{ success: boolean; message: string; expiresIn: number }> {
  const res = await fetch(`${API_BASE}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to send OTP');
  }
  return await res.json();
}

export async function verifyOtp(phoneNumber: string, otpCode: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API_BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otpCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Invalid OTP code');
  }
  return await res.json();
}

export async function fetchJobs(filters?: JobFilterParams): Promise<JobDTO[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.taluk && filters.taluk !== 'ALL') params.append('taluk', filters.taluk);
    if (filters?.isWalkIn !== undefined) params.append('isWalkIn', String(filters.isWalkIn));
    if (filters?.q) params.append('q', filters.q);

    const url = `${API_BASE}/jobs${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.debug('API fetchJobs error:', err);
    return [];
  }
}

export async function fetchJobById(id: string): Promise<JobDTO | null> {
  try {
    const res = await fetch(`${API_BASE}/jobs/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createJobDraft(jobData: Partial<JobDTO>): Promise<JobDTO> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create job: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function submitJobForReview(jobId: string): Promise<JobDTO> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/submit`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to submit job: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchModerationQueue(): Promise<JobDTO[]> {
  try {
    const headers = getAdminHeaders();
    const res = await fetch(`${API_BASE}/jobs/moderation/queue`, {
      cache: 'no-store',
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.debug('API fetchModerationQueue error:', err);
    return [];
  }
}

export async function verifyEmployer(jobId: string): Promise<JobDTO> {
  const headers = getAdminHeaders();
  const res = await fetch(`${API_BASE}/jobs/${jobId}/verify-employer`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Verification failed: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function moderateJob(
  jobId: string,
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY_EMPLOYER' | 'CLOSE',
  reason?: string
): Promise<JobDTO> {
  const headers = getAdminHeaders();
  const res = await fetch(`${API_BASE}/jobs/${jobId}/moderate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Moderation action failed: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function submitApplication(payload: {
  jobId: string;
  candidate: { id: string; name: string; phone: string; taluk?: string; matchScore?: number; resumeUrl?: string };
  coverNote?: string;
}): Promise<ApplicationDTO> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to submit application: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchApplications(candidateId?: string): Promise<ApplicationDTO[]> {
  try {
    const url = candidateId
      ? `${API_BASE}/applications/candidate/${candidateId}`
      : `${API_BASE}/applications`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function withdrawApplication(appId: string, candidateId: string): Promise<ApplicationDTO> {
  const res = await fetch(`${API_BASE}/applications/${appId}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Withdrawal failed: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function uploadResumeFile(fileMeta: {
  originalname: string;
  size: number;
  base64Data: string;
  mimetype?: string;
  candidateId?: string;
}) {
  const res = await fetch(`${API_BASE}/resumes/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileMeta),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'File upload failed');
  }
  return await res.json();
}

export async function saveCandidateProfile(profileData: any) {
  const res = await fetch(`${API_BASE}/candidate/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save profile');
  }
  return await res.json();
}

export async function fetchCandidateProfile(candidateId: string) {
  try {
    const res = await fetch(`${API_BASE}/candidate/profile/${candidateId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function seedDemoData(): Promise<any> {
  const headers = getAdminHeaders();
  const [jobsRes, appsRes] = await Promise.all([
    fetch(`${API_BASE}/jobs/seed`, { method: 'POST', headers }),
    fetch(`${API_BASE}/applications/seed`, { method: 'POST', headers }),
  ]);
  if (!jobsRes.ok || !appsRes.ok) {
    throw new Error('Seed request failed on server');
  }
  return { jobs: await jobsRes.json(), applications: await appsRes.json() };
}

export async function resetData(): Promise<any> {
  const headers = getAdminHeaders();
  const [jobsRes, appsRes] = await Promise.all([
    fetch(`${API_BASE}/jobs/reset`, { method: 'POST', headers }),
    fetch(`${API_BASE}/applications/reset`, { method: 'POST', headers }),
  ]);
  if (!jobsRes.ok || !appsRes.ok) {
    throw new Error('Reset request failed on server');
  }
  return { jobs: await jobsRes.json(), applications: await appsRes.json() };
}
