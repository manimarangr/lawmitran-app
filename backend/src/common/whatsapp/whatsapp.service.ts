import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendMessage(mobile: string, message: string): Promise<void> {
    this.logger.log(`[placeholder whatsapp] message to ${mobile}: ${message}`);
    return Promise.resolve();
  }
}
