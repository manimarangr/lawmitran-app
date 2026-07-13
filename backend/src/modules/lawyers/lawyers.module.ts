import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { StorageModule } from '../../common/storage/storage.module';
import { LawyersController } from './lawyers.controller';
import { LawyersService } from './lawyers.service';
import { AwardsService } from './awards.service';

@Module({
  imports: [StorageModule, MailModule],
  controllers: [LawyersController],
  providers: [LawyersService, AwardsService],
  exports: [LawyersService],
})
export class LawyersModule {}
