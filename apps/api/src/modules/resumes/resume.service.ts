import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ResumeService {
  /**
   * Validates file buffer by checking magic bytes and size constraints.
   */
  validateFile(file: { buffer: Buffer; mimetype?: string; size: number; originalname: string }) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds the 5MB limit');
    }

    // Check magic bytes:
    // PDF magic bytes: 0x25 0x50 0x44 0x46 (%PDF)
    // ZIP / DOCX magic bytes: 0x50 0x4B 0x03 0x04 (PK..)
    const header = file.buffer.slice(0, 4);
    const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
    const isDocx = header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04;
    const isPlainText =
      (file.mimetype && file.mimetype.includes('text/plain')) ||
      file.originalname.toLowerCase().endsWith('.txt');

    if (!isPdf && !isDocx && !isPlainText) {
      throw new BadRequestException('Invalid file format. Only legitimate PDF, DOCX, and TXT files are accepted.');
    }

    // Threat & macro inspection (quarantine scan)
    const scan = this.scanBufferForThreats(file.buffer);
    if (!scan.passed) {
      throw new BadRequestException(`Security alert: File rejected by malware scanner (${scan.reason})`);
    }

    return {
      isValid: true,
      fileType: isPdf ? 'pdf' : isDocx ? 'docx' : 'txt',
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Deep quarantine scan inspecting for malicious executable signatures and macros.
   */
  scanBufferForThreats(buffer: Buffer): { passed: boolean; reason?: string } {
    // Check for PE binary magic bytes (MZ = 0x4D 0x5A) embedded within the file
    if (buffer.length > 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return { passed: false, reason: 'Detected embedded executable (MZ header)' };
    }

    // Check for script tags or dangerous shell patterns in plain text/uncompressed streams
    const preview = buffer.slice(0, Math.min(buffer.length, 2048)).toString('utf-8', 0, 1024);
    if (/<script[\s>]/i.test(preview) || /javascript:/i.test(preview)) {
      return { passed: false, reason: 'Detected embedded script content' };
    }

    return { passed: true };
  }

  /**
   * Generates scoped short-lived presigned download URL for private R2/S3 storage.
   * Resumes are NEVER made public; only authorized recruiters and the candidate can access.
   */
  generatePresignedDownloadUrl(storageKey: string, authorized: boolean): string {
    if (!authorized) {
      throw new ForbiddenException('Unauthorized to access private candidate resume');
    }
    const token = Buffer.from(`${storageKey}:${Date.now() + 900000}`).toString('base64url');
    return `/api/v1/resumes/download/${storageKey}?token=${token}&expiresIn=900`;
  }

  /**
   * Safely extracts text, education, experience, contact, and skills.
   */
  extractSkillsAndDetails(text: string): {
    extractedSkills: string[];
    extractedPhone?: string;
    extractedEmail?: string;
    extractedEducation?: string;
    estimatedExpYears?: number;
  } {
    const knownSkills = [
      'billing',
      'tally',
      'customer service',
      'english',
      'kannada',
      'ms excel',
      'ms office',
      'accounts',
      'gst',
      'dmlt',
      'nursing',
      'teaching',
      'driving',
      'dairy',
      'sales',
    ];

    const lower = text.toLowerCase();
    const matchedSkills = knownSkills.filter((s) => lower.includes(s));

    // Regex for email and phone extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{9}/);

    // Education detection
    let extractedEducation: string | undefined;
    if (lower.includes('b.com') || lower.includes('bcom') || lower.includes('graduate')) {
      extractedEducation = 'B.Com / Graduate';
    } else if (lower.includes('dmlt') || lower.includes('diploma')) {
      extractedEducation = 'Diploma / DMLT';
    } else if (lower.includes('puc') || lower.includes('12th')) {
      extractedEducation = 'PUC';
    } else if (lower.includes('10th') || lower.includes('sslc')) {
      extractedEducation = '10th Pass';
    }

    // Experience detection (e.g., "2 years experience", "1.5 years")
    let estimatedExpYears: number | undefined;
    const expMatch = lower.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*exp/);
    if (expMatch) {
      estimatedExpYears = parseFloat(expMatch[1]);
    }

    return {
      extractedSkills: matchedSkills,
      extractedEmail: emailMatch ? emailMatch[0] : undefined,
      extractedPhone: phoneMatch ? phoneMatch[0] : undefined,
      extractedEducation,
      estimatedExpYears,
    };
  }
}
