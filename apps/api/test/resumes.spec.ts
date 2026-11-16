import { ResumeService } from '../src/modules/resumes/resume.service';

describe('Resume File Security & Text Extraction', () => {
  let service: ResumeService;

  beforeEach(() => {
    service = new ResumeService();
  });

  it('accepts legitimate PDF files with valid %PDF magic header', () => {
    const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const res = service.validateFile({
      buffer: validPdfBuffer,
      mimetype: 'application/pdf',
      size: 1024,
      originalname: 'resume.pdf',
    });
    expect(res.isValid).toBe(true);
    expect(res.fileType).toBe('pdf');
  });

  it('rejects executable binary disguised as a pdf', () => {
    // Windows PE executable header: MZ (0x4D 0x5A)
    const fakePdfBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
    expect(() => {
      service.validateFile({
        buffer: fakePdfBuffer,
        mimetype: 'application/pdf',
        size: 2048,
        originalname: 'malware.pdf',
      });
    }).toThrow('Invalid file format');
  });

  it('rejects files larger than 5MB', () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    expect(() => {
      service.validateFile({
        buffer: largeBuffer,
        mimetype: 'application/pdf',
        size: 6 * 1024 * 1024,
        originalname: 'huge.pdf',
      });
    }).toThrow('File size exceeds the 5MB limit');
  });

  it('safely extracts skills and contact details from resume text', () => {
    const resumeText = `
      Priya R.
      Phone: 9845987654 | Email: priya.mandya@gmail.com
      Skills: Experienced in Tally ERP 9, retail billing, and customer service.
      Education: B.Com from Mandya University.
    `;

    const extracted = service.extractSkillsAndDetails(resumeText);
    expect(extracted.extractedSkills).toContain('tally');
    expect(extracted.extractedSkills).toContain('billing');
    expect(extracted.extractedSkills).toContain('customer service');
    expect(extracted.extractedPhone).toBe('9845987654');
    expect(extracted.extractedEmail).toBe('priya.mandya@gmail.com');
  });
});
