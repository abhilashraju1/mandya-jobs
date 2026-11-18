import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'mandya-jobs-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      features: {
        pwa: true,
        bilingual: ['kn', 'en'],
        matchingEngine: 'deterministic-v1.2',
        antiFraudScanner: true,
      },
    };
  }
}
