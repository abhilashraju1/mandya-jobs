import { Controller, Post, Get, Param, Body, Query, Res, Headers, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { AuthService } from '../auth/auth.service';
import { RoleType } from '@mandya-jobs/types';

@Controller('resumes')
export class ResumesController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly authService: AuthService
  ) {}

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
    @Headers() headers: Record<string, any>,
    @Body()
    body: {
      originalname: string;
      size: number;
      base64Data: string;
      mimetype?: string;
      candidateId?: string;
    }
  ) {
    let candidateId = body.candidateId || 'cand_1';
    try {
      const user = this.authService.extractUserFromHeaders(headers);
      candidateId = user.sub || user.id || candidateId;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Authentication required to upload resume');
      }
    }

    const buffer = Buffer.from(body.base64Data, 'base64');
    return this.resumeService.uploadFile({
      buffer,
      originalname: body.originalname,
      size: body.size,
      mimetype: body.mimetype,
      candidateId,
    });
  }

  @Get(':id/download')
  downloadFile(@Headers() headers: Record<string, any>, @Param('id') id: string, @Res() res: any) {
    const { buffer, meta } = this.resumeService.getResumeFile(id);

    try {
      const user = this.authService.extractUserFromHeaders(headers);
      const isOwner = (user.sub || user.id) === meta.candidateId;
      const isPrivileged = user.roles?.some((r: RoleType) =>
        [RoleType.SUPER_ADMIN, RoleType.MODERATOR, RoleType.EMPLOYER_RECRUITER].includes(r)
      );
      if (!isOwner && !isPrivileged) {
        throw new ForbiddenException('Not authorized to access this candidate resume');
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Authentication required to download resume');
    }

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
