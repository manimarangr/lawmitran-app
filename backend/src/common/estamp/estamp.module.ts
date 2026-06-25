import { Module } from '@nestjs/common';
import { EstampService } from './estamp.service';

@Module({
  providers: [EstampService],
  exports: [EstampService],
})
export class EstampModule {}
