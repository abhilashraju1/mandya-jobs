import { JobDTO, ApplicationDTO, JobFilterParams } from '@mandya-jobs/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
    console.debug('API fetchJobs fallback:', err);
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
  if (!res.ok) throw new Error(`Failed to create job: HTTP ${res.status}`);
  return await res.json();
}

export async function submitJobForReview(jobId: string): Promise<JobDTO> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/submit`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to submit job: HTTP ${res.status}`);
  return await res.json();
}

export async function fetchModerationQueue(): Promise<JobDTO[]> {
  try {
    const res = await fetch(`${API_BASE}/jobs/moderation/queue`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.debug('API fetchModerationQueue fallback:', err);
    return [];
  }
}

export async function moderateJob(
  jobId: string,
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
  reason?: string
): Promise<JobDTO> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reason }),
  });
  if (!res.ok) throw new Error(`Moderation action failed: HTTP ${res.status}`);
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
  if (!res.ok) throw new Error(`Withdrawal failed: HTTP ${res.status}`);
  return await res.json();
}

export async function seedDemoData(): Promise<any> {
  try {
    const [jobsRes, appsRes] = await Promise.all([
      fetch(`${API_BASE}/jobs/seed`, { method: 'POST' }),
      fetch(`${API_BASE}/applications/seed`, { method: 'POST' }),
    ]);
    return { jobs: await jobsRes.json(), applications: await appsRes.json() };
  } catch (err: any) {
    throw new Error(err.message || 'Seed failed');
  }
}

export async function resetData(): Promise<any> {
  try {
    const [jobsRes, appsRes] = await Promise.all([
      fetch(`${API_BASE}/jobs/reset`, { method: 'POST' }),
      fetch(`${API_BASE}/applications/reset`, { method: 'POST' }),
    ]);
    return { jobs: await jobsRes.json(), applications: await appsRes.json() };
  } catch (err: any) {
    throw new Error(err.message || 'Reset failed');
  }
}

export async function validateResumeFile(fileMeta: {
  originalname: string;
  size: number;
  base64Data: string;
  mimetype?: string;
}) {
  const res = await fetch(`${API_BASE}/resumes/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileMeta),
  });
  if (!res.ok) throw new Error('File validation failed');
  return await res.json();
}
