import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
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

  @Get('download/:storageKey')
  getPresignedUrl(@Param('storageKey') storageKey: string, @Query('authorized') authorized: string) {
    const isAuth = authorized === 'true' || authorized === '1';
    const downloadUrl = this.resumeService.generatePresignedDownloadUrl(storageKey, isAuth);
    return { downloadUrl };
  }
}
