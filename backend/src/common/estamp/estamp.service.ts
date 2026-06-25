import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface StampRequest {
  referenceId: string;
  status: 'PENDING';
}

/**
 * Placeholder seam for e-stamping (India requires a licensed vendor such as
 * SHCIL or a Digio/Leegality e-stamp add-on — no vendor has been selected
 * yet). Swap the body of requestStamping() for a real provider call once one
 * is chosen.
 */
@Injectable()
export class EstampService {
  private readonly logger = new Logger(EstampService.name);

  async requestStamping(
    documentUrl: string,
    stateCode: string,
    amount: number,
  ): Promise<StampRequest> {
    const referenceId = `estamp_dev_${randomUUID()}`;
    this.logger.log(
      `[placeholder estamp] stamping requested for ${documentUrl} in ${stateCode} for ₹${amount}: ${referenceId}`,
    );
    return Promise.resolve({ referenceId, status: 'PENDING' });
  }
}
