import { Module } from '@nestjs/common';
import { RetiradasController } from './retiradas.controller.js';
import { RetiradasService } from './retiradas.service.js';

@Module({
  controllers: [RetiradasController],
  providers: [RetiradasService],
})
export class RetiradasModule {}
