import { JobsService } from '../src/modules/jobs/jobs.service';
import { JobStatus } from '@mandya-jobs/types';

describe('Jobs Service & Moderation Workflow', () => {
  let service: JobsService;

  beforeEach(() => {
    service = new JobsService();
  });

  it('publishes genuine job after moderator approval', () => {
    const draft = service.createDraft({
      title: 'Showroom Sales Assistant',
      description: 'Assist walk-in customers and manage garment display.',
      taluk: 'Mandya Town',
      requiredSkills: ['customer service', 'sales'],
    });

    expect(draft.status).toBe(JobStatus.DRAFT);

    const submitted = service.submitForReview(draft.id);
    expect(submitted.status).toBe(JobStatus.SUBMITTED);
    expect(submitted.fraudAlerts?.length).toBe(0);

    const approved = service.moderateJob(submitted.id, 'APPROVE');
    expect(approved.status).toBe(JobStatus.PUBLISHED);

    // Now it must appear in public search
    const publicList = service.getAllPublished();
    expect(publicList.some((j) => j.id === draft.id)).toBe(true);
  });

  it('automatically flags job containing registration fee and allows moderator rejection', () => {
    const scamDraft = service.createDraft({
      title: 'Online Typing Work',
      description: 'Typing jobs at home. Candidates must pay a registration fee of 500 INR.',
      contactPhone: '9845012345',
    });

    const submitted = service.submitForReview(scamDraft.id);
    expect(submitted.fraudAlerts).toBeDefined();
    expect(submitted.fraudAlerts![0]).toContain('registration fee');

    // Moderator rejects it
    const rejected = service.moderateJob(scamDraft.id, 'REJECT', 'FEE_PROHIBITED');
    expect(rejected.status).toBe(JobStatus.REJECTED);

    // It must NEVER appear in public search
    const publicList = service.getAllPublished();
    expect(publicList.some((j) => j.id === scamDraft.id)).toBe(false);
  });
});
