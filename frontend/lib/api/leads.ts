import { authFetch } from './client';
import type { Lead, LeadStatus, RevealedContact } from '@/types/lead';

// ---- Lawyer ----
export function fetchLawyerLeads() {
  return authFetch<Lead[]>('/leads/lawyer/me');
}

export function updateLeadStatus(id: string, status: LeadStatus) {
  return authFetch<Lead>(`/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function revealContact(id: string) {
  return authFetch<RevealedContact>(`/leads/${id}/reveal-contact`, {
    method: 'POST',
  });
}

// ---- Client ----
export interface CreateLeadInput {
  lawyerId: string;
  practiceArea?: string;
  description: string;
}

/** Submit a requirement to a lawyer — the core marketplace action. */
export function createLead(input: CreateLeadInput) {
  return authFetch<Lead>('/leads', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchMyLeads() {
  return authFetch<Lead[]>('/leads/me');
}

export function confirmContact(id: string) {
  return authFetch<Lead>(`/leads/${id}/confirm-contact`, { method: 'POST' });
}

export function withdrawLead(id: string, reason?: string) {
  return authFetch<Lead>(`/leads/${id}/withdraw`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}
