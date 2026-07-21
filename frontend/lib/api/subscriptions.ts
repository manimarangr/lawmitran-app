import { authFetch } from './client';
import { API_BASE } from './base';
import type { MySubscription } from '@/types/lead';
import type {
  CheckoutOrder,
  PlanName,
  PlanTier,
  VerifyPaymentInput,
} from '@/types/subscription';

export function fetchMySubscription() {
  return authFetch<MySubscription>('/subscriptions/me');
}

/** Public — active duration tiers for the pricing page. */
export function fetchPlanTiers() {
  return authFetch<PlanTier[]>('/subscriptions/plans/tiers');
}

/**
 * Server Component–safe variant of fetchPlanTiers — authFetch touches
 * localStorage/window, which don't exist during SSR. Same public endpoint,
 * plain fetch, and fails soft (empty array) so callers just fall back to
 * their default copy instead of breaking the page render.
 */
export async function fetchPlanTiersServer(): Promise<PlanTier[]> {
  try {
    const res = await fetch(`${API_BASE}/subscriptions/plans/tiers`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    return (await res.json()) as PlanTier[];
  } catch {
    return [];
  }
}

/** Create a Razorpay order for a plan + duration. */
export function createCheckout(planName: PlanName, durationDays: number) {
  return authFetch<CheckoutOrder>('/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify({ planName, durationDays }),
  });
}

/** Verify the Razorpay signature and activate the subscription. */
export function verifyCheckout(input: VerifyPaymentInput) {
  return authFetch('/subscriptions/checkout/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
