import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private config: ConfigService) {}

  get keyId(): string | undefined {
    return this.config.get<string>('RAZORPAY_KEY_ID');
  }

  /** Amount is in the smallest currency unit (paise) per Razorpay convention. */
  async createOrder(
    amountInPaise: number,
    receipt: string,
  ): Promise<RazorpayOrder> {
    const keyId = this.keyId;
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn(
        'RAZORPAY_KEY_ID/SECRET not configured — returning a dev placeholder order',
      );
      return {
        id: `order_dev_${randomUUID()}`,
        amount: amountInPaise,
        currency: 'INR',
      };
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt }),
    });

    if (!response.ok) {
      throw new Error(
        `Razorpay order creation failed with status ${response.status}`,
      );
    }

    const order = (await response.json()) as RazorpayOrderResponse;
    return { id: order.id, amount: order.amount, currency: order.currency };
  }

  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      this.logger.warn(
        'RAZORPAY_KEY_SECRET not configured — skipping payment signature verification',
      );
      return true;
    }

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expectedSignature === signature;
  }
}
