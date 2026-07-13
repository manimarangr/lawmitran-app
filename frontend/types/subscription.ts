export type PlanName = 'BASIC' | 'PREMIUM';

export interface TierOffer {
  id: string;
  name: string;
  description: string | null;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  endsAt: string;
}

export interface PlanTier {
  id: string;
  planName: PlanName;
  durationDays: number;
  label: string;
  amount: string; // Decimal serialized as string
  active: boolean;
  offer: TierOffer | null;
  offerAmount: number | null; // discounted price when an offer applies
}

export interface CheckoutOrder {
  paymentId: string;
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  razorpayKeyId: string | null;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
