import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ResumeService {
  /**
   * Validates file buffer by checking magic bytes and size constraints.
   */
  validateFile(file: { buffer: Buffer; mimetype: string; size: number; originalname: string }) {
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
    const isPlainText = file.mimetype.includes('text/plain') || file.originalname.endsWith('.txt');

    if (!isPdf && !isDocx && !isPlainText) {
      throw new BadRequestException('Invalid file format. Only legitimate PDF, DOCX, and TXT files are accepted.');
    }

    return {
      isValid: true,
      fileType: isPdf ? 'pdf' : isDocx ? 'docx' : 'txt',
    };
  }

  /**
   * Safely extracts text and identifies common skills from plain text or parsed content
   */
  extractSkillsAndDetails(text: string): {
    extractedSkills: string[];
    extractedPhone?: string;
    extractedEmail?: string;
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

    // Simple regex for email and phone extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{9}/);

    return {
      extractedSkills: matchedSkills,
      extractedEmail: emailMatch ? emailMatch[0] : undefined,
      extractedPhone: phoneMatch ? phoneMatch[0] : undefined,
    };
  }
}
