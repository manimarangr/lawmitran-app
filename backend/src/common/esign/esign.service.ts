import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface SignatureRequest {
  referenceId: string;
  status: 'PENDING';
}

/**
 * Placeholder seam for e-signature (India requires a licensed ASP such as
 * Digio, Leegality, or eMudhra — no vendor has been selected yet). Swap the
 * body of requestSignature() for a real provider call once one is chosen.
 */
@Injectable()
export class EsignService {
  private readonly logger = new Logger(EsignService.name);

  async requestSignature(
    documentUrl: string,
    signerEmail: string,
  ): Promise<SignatureRequest> {
    const referenceId = `esign_dev_${randomUUID()}`;
    this.logger.log(
      `[placeholder esign] signature requested for ${signerEmail} on ${documentUrl}: ${referenceId}`,
    );
    return Promise.resolve({ referenceId, status: 'PENDING' });
  }
}
