import { Module } from '@nestjs/common';
import { EsignService } from './esign.service';

@Module({
  providers: [EsignService],
  exports: [EsignService],
})
export class EsignModule {}
