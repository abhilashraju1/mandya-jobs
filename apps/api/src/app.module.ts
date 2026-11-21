import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { HealthController } from './common/health.controller';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [AuthModule, JobsModule, ApplicationsModule, ResumesModule, CandidateModule],
  controllers: [HealthController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
