import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumesController } from './resumes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ResumesController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumesModule {}
