import { ApplicationsService } from '../src/modules/applications/applications.service';
import { ApplicationStatus } from '@mandya-jobs/types';

describe('Applications Service & State Machine', () => {
  let service: ApplicationsService;

  beforeEach(() => {
    service = new ApplicationsService();
  });

  it('allows candidate to apply with any match score (including low score)', () => {
    const app = service.apply('job_2', {
      id: 'cand_test',
      name: 'Raju K.',
      phone: '9845000000',
      matchScore: 34,
    }, 'Eager to learn and work hard.');

    expect(app.id).toBeDefined();
    expect(app.status).toBe(ApplicationStatus.SUBMITTED);
    expect(app.matchScore).toBe(34);
  });

  it('prevents duplicate active application to the same job', () => {
    service.apply('job_10', {
      id: 'cand_duplicate',
      name: 'Anil Kumar',
      phone: '9845111111',
    });

    expect(() => {
      service.apply('job_10', {
        id: 'cand_duplicate',
        name: 'Anil Kumar',
        phone: '9845111111',
      });
    }).toThrow('You have already applied for this vacancy');
  });

  it('transitions application through recruitment stages', () => {
    const app = service.apply('job_20', {
      id: 'cand_stages',
      name: 'Suresh M.',
      phone: '9845222222',
    });

    const shortlisted = service.updateStatus(app.id, ApplicationStatus.SHORTLISTED, 'Shortlisted based on showroom experience');
    expect(shortlisted.status).toBe(ApplicationStatus.SHORTLISTED);

    const interview = service.scheduleInterview(app.id, {
      scheduledDate: '2026-11-20 10:30 AM',
      venueOrLink: 'Sri Lakshmi Showroom, VV Road, Mandya',
      instructions: 'Bring hard copy of certificates',
    });

    expect(interview.status).toBe(ApplicationStatus.INTERVIEW_SCHEDULED);
    expect(interview.interview?.scheduledDate).toBe('2026-11-20 10:30 AM');

    const hired = service.updateStatus(app.id, ApplicationStatus.HIRED, 'Candidate accepted offer');
    expect(hired.status).toBe(ApplicationStatus.HIRED);
  });

  it('allows candidate to withdraw application', () => {
    const app = service.apply('job_30', {
      id: 'cand_withdraw',
      name: 'Deepa S.',
      phone: '9845333333',
    });

    const withdrawn = service.withdraw(app.id, 'cand_withdraw');
    expect(withdrawn.status).toBe(ApplicationStatus.WITHDRAWN);
  });
});
