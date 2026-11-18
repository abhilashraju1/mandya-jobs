import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumesController } from './resumes.controller';

@Module({
  controllers: [ResumesController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumesModule {}
