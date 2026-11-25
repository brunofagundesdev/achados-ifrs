import { Module } from '@nestjs/common';
import { PerfisController } from './perfis.controller.js';
import { PerfisService } from './perfis.service.js';

@Module({
  controllers: [PerfisController],
  providers: [PerfisService],
})
export class PerfisModule {}
