import { authFetch } from './client';

export interface CreateRatingInput {
  lawyerId: string;
  leadId: string;
  score: number;
  comment?: string;
}

/** Rate a lawyer after the lead is closed (one rating per lead). */
export function createRating(input: CreateRatingInput) {
  return authFetch('/ratings', { method: 'POST', body: JSON.stringify(input) });
}
