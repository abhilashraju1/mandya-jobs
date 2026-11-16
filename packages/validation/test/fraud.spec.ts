import { detectJobFraud } from '../src/fraud-detection';

describe('Fraud and Scam Heuristics Detection', () => {
  it('flags intentional suspicious work-from-home job with registration fee', () => {
    const job = {
      title: 'Data Entry Work From Home',
      description: 'Earn 3000 daily typing captchas. Must pay a refundable registration fee of 500 INR before training.',
      contactPhone: '9840000000',
    };

    const result = detectJobFraud(job);
    expect(result.isFlagged).toBe(true);
    expect(result.flags.some((f) => f.includes('registration fee'))).toBe(true);
  });

  it('flags invalid phone number format', () => {
    const job = {
      title: 'Store Executive',
      description: 'Manage counter sales.',
      contactPhone: '12345',
    };

    const result = detectJobFraud(job);
    expect(result.isFlagged).toBe(true);
    expect(result.flags.some((f) => f.includes('valid Indian mobile number'))).toBe(true);
  });

  it('passes genuine employer vacancy with zero flags', () => {
    const job = {
      title: 'Billing Executive',
      description: 'Handle counter billing and customer queries at Sri Lakshmi Showroom, Mandya.',
      contactPhone: '9845012345',
    };

    const result = detectJobFraud(job);
    expect(result.isFlagged).toBe(false);
    expect(result.flags.length).toBe(0);
  });
});
