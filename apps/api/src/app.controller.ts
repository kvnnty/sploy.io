import { Controller, Get } from '@nestjs/common';
import { Public } from './auth';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
