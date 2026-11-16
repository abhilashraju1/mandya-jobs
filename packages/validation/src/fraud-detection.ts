/**
 * Automated Fraud & Risk Detection Heuristics for Mandya Jobs
 * Scans job descriptions, requirements, and contact fields for forbidden patterns.
 */

const SUSPICIOUS_FEE_PHRASES = [
  'registration fee',
  'security deposit',
  'training charge',
  'pay to apply',
  'application fee',
  'advance payment',
  'laptop deposit',
  'processing charge',
  'ನೋಂದಣಿ ಶುಲ್ಕ',
  'ಠೇವಣಿ',
];

const SUSPICIOUS_COMMUNICATION_CHANNELS = [
  'telegram only',
  'whatsapp only for payment',
  'send money to',
  'gpay fee',
  'phonepe fee',
];

export interface FraudCheckResult {
  isFlagged: boolean;
  flags: string[];
}

export function detectJobFraud(job: {
  title: string;
  description: string;
  contactPhone?: string;
  contactEmail?: string;
}): FraudCheckResult {
  const flags: string[] = [];
  const textToScan = `${job.title} ${job.description}`.toLowerCase();

  for (const phrase of SUSPICIOUS_FEE_PHRASES) {
    if (textToScan.includes(phrase.toLowerCase())) {
      flags.push(`Flagged: "${phrase}" (recruitment fee violation)`);
    }
  }

  for (const channel of SUSPICIOUS_COMMUNICATION_CHANNELS) {
    if (textToScan.includes(channel.toLowerCase())) {
      flags.push(`Suspicious contact channel detected: "${channel}"`);
    }
  }

  // Check invalid phone number format (if provided)
  if (job.contactPhone) {
    const cleanPhone = job.contactPhone.replace(/[\s-+]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      flags.push('Contact phone does not look like a valid Indian mobile number');
    }
  }

  return {
    isFlagged: flags.length > 0,
    flags,
  };
}
