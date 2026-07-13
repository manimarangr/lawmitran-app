import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { StorageModule } from '../../common/storage/storage.module';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

@Module({
  imports: [MailModule, StorageModule],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}
