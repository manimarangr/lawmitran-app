import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { StorageModule } from '../../common/storage/storage.module';
import { LawyersController } from './lawyers.controller';
import { LawyersService } from './lawyers.service';

@Module({
  imports: [StorageModule, MailModule],
  controllers: [LawyersController],
  providers: [LawyersService],
  exports: [LawyersService],
})
export class LawyersModule {}
