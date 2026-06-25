import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { WhatsappModule } from '../../common/whatsapp/whatsapp.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [MailModule, WhatsappModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
