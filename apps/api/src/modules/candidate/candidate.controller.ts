import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CandidateService } from './candidate.service';

@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post('profile')
  saveProfile(@Body() body: any) {
    return this.candidateService.saveProfile(body);
  }

  @Get('profile/:id')
  getProfile(@Param('id') id: string) {
    return this.candidateService.getProfile(id);
  }

  @Get('profiles')
  getAllProfiles() {
    return this.candidateService.getAllProfiles();
  }
}
