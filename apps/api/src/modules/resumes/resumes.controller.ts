import { Controller, Post, Get, Param, Body, Query, Res, Response } from '@nestjs/common';
import { ResumeService } from './resume.service';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('extract')
  extractFromText(@Body() body: { text: string }) {
    return this.resumeService.extractSkillsAndDetails(body.text);
  }

  @Post('validate')
  validateMetadata(@Body() fileMeta: { originalname: string; size: number; base64Data: string; mimetype?: string }) {
    const buffer = Buffer.from(fileMeta.base64Data, 'base64');
    return this.resumeService.validateFile({
      buffer,
      size: fileMeta.size,
      originalname: fileMeta.originalname,
      mimetype: fileMeta.mimetype,
    });
  }

  @Post('upload')
  uploadResume(
    @Body()
    body: {
      originalname: string;
      size: number;
      base64Data: string;
      mimetype?: string;
      candidateId?: string;
    }
  ) {
    const buffer = Buffer.from(body.base64Data, 'base64');
    return this.resumeService.uploadFile({
      buffer,
      originalname: body.originalname,
      size: body.size,
      mimetype: body.mimetype,
      candidateId: body.candidateId || 'cand_guest',
    });
  }

  @Get(':id/download')
  downloadFile(@Param('id') id: string, @Res() res: any) {
    const { buffer, meta } = this.resumeService.getResumeFile(id);
    const contentType =
      meta.fileType === 'pdf'
        ? 'application/pdf'
        : meta.fileType === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'text/plain';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${meta.originalName}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('download/:storageKey')
  getPresignedUrl(@Param('storageKey') storageKey: string, @Query('authorized') authorized: string) {
    const isAuth = authorized === 'true' || authorized === '1';
    const downloadUrl = this.resumeService.generatePresignedDownloadUrl(storageKey, isAuth);
    return { downloadUrl };
  }
}
