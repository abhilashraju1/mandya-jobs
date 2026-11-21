import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ResumeMetadata {
  id: string;
  candidateId: string;
  originalName: string;
  size: number;
  fileType: string;
  storagePath: string;
  createdAt: string;
}

@Injectable()
export class ResumeService {
  private resumes: ResumeMetadata[] = [];
  private uploadsDir: string;
  private metadataFile: string;

  constructor() {
    this.uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../../uploads/resumes');
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../../data');
    this.metadataFile = path.join(dataDir, 'resumes.json');

    try {
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(this.metadataFile)) {
        const raw = fs.readFileSync(this.metadataFile, 'utf-8');
        this.resumes = JSON.parse(raw);
      } else {
        this.resumes = [];
      }
    } catch {
      this.resumes = [];
    }
  }

  private saveMetadata() {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(this.resumes, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write resume metadata to disk:', err);
    }
  }

  validateFile(file: { buffer: Buffer; mimetype?: string; size: number; originalname: string }) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds the 5MB limit');
    }

    const header = file.buffer.slice(0, 4);
    const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
    const isDocx = header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04;
    const isPlainText =
      (file.mimetype && file.mimetype.includes('text/plain')) ||
      file.originalname.toLowerCase().endsWith('.txt');

    if (!isPdf && !isDocx && !isPlainText) {
      throw new BadRequestException('Invalid file format. Only legitimate PDF, DOCX, and TXT files are accepted.');
    }

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

  scanBufferForThreats(buffer: Buffer): { passed: boolean; reason?: string } {
    if (buffer.length > 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return { passed: false, reason: 'Detected embedded executable (MZ header)' };
    }
    const preview = buffer.slice(0, Math.min(buffer.length, 2048)).toString('utf-8', 0, 1024);
    if (/<script[\s>]/i.test(preview) || /javascript:/i.test(preview)) {
      return { passed: false, reason: 'Detected embedded script content' };
    }
    return { passed: true };
  }

  uploadFile(file: {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype?: string;
    candidateId: string;
  }): ResumeMetadata & { downloadUrl: string } {
    const validation = this.validateFile(file);

    const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = path.join(this.uploadsDir, `${resumeId}_${sanitizedName}`);

    fs.writeFileSync(storagePath, file.buffer);

    const meta: ResumeMetadata = {
      id: resumeId,
      candidateId: file.candidateId,
      originalName: file.originalname,
      size: file.size,
      fileType: validation.fileType,
      storagePath,
      createdAt: new Date().toISOString(),
    };

    this.resumes.push(meta);
    this.saveMetadata();

    return {
      ...meta,
      downloadUrl: `/api/v1/resumes/${resumeId}/download`,
    };
  }

  getResumeMeta(id: string): ResumeMetadata {
    const meta = this.resumes.find((r) => r.id === id);
    if (!meta) {
      throw new NotFoundException(`Resume with ID ${id} not found`);
    }
    return meta;
  }

  getResumeFile(id: string): { buffer: Buffer; meta: ResumeMetadata } {
    const meta = this.getResumeMeta(id);
    if (!fs.existsSync(meta.storagePath)) {
      throw new NotFoundException('Resume file not found on storage disk');
    }
    const buffer = fs.readFileSync(meta.storagePath);
    return { buffer, meta };
  }

  generatePresignedDownloadUrl(storageKey: string, authorized: boolean): string {
    if (!authorized) {
      throw new ForbiddenException('Unauthorized to access private candidate resume');
    }
    const token = Buffer.from(`${storageKey}:${Date.now() + 900000}`).toString('base64url');
    return `/api/v1/resumes/download/${storageKey}?token=${token}&expiresIn=900`;
  }

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

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{9}/);

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
