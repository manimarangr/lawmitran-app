import { authFetch } from './client';
import type { Paginated } from '@/types/pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ---- types ----

export interface TemplateField {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'number' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Optional step grouping (e.g. "Landlord", "Tenant") — fields sharing a
   *  section render together as one wizard step. */
  section?: string;
}

export interface DocCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  templateCount: number;
}

export interface DocTemplateListItem {
  id: string;
  title: string;
  slug: string;
  keywords: string[];
  price: string;
  language: string;
  requiresStamp: boolean;
  stampBasis: string | null;
  category: { name: string; slug: string };
}

export interface DocTemplate extends DocTemplateListItem {
  version: number;
  schemaJson: { fields?: TemplateField[] } | null;
}

export type DocStatus = 'DRAFT' | 'GENERATED' | 'PAID' | 'DELIVERED';

export interface MyDocument {
  id: string;
  status: DocStatus;
  amount: string | null;
  createdAt: string;
  contentHtml?: string | null;
  template: { title: string; slug: string; requiresStamp: boolean; stampBasis: string | null };
}

// ---- public ----

export async function fetchDocCategories(): Promise<DocCategory[]> {
  const res = await fetch(`${API_BASE}/documents/categories`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json() as Promise<DocCategory[]>;
}

export async function fetchDocTemplates(category?: string): Promise<DocTemplateListItem[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`${API_BASE}/documents/templates${qs}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to load templates');
  return res.json() as Promise<DocTemplateListItem[]>;
}

export async function fetchDocTemplate(idOrSlug: string): Promise<DocTemplate | null> {
  const res = await fetch(`${API_BASE}/documents/templates/${idOrSlug}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json() as Promise<DocTemplate>;
}

export async function previewDocument(idOrSlug: string, input: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/documents/templates/${idOrSlug}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body?.message ?? 'Preview failed');
  }
  return res.json() as Promise<{ title: string; previewText: string; truncated: boolean }>;
}

/** AI prefill from the user's own description (returns {} when AI is off). */
export async function prefillDocument(idOrSlug: string, context: string) {
  const res = await fetch(`${API_BASE}/documents/templates/${idOrSlug}/prefill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) return { values: {} as Record<string, string> };
  return res.json() as Promise<{ values: Record<string, string> }>;
}

// ---- buyer (authenticated) ----

export interface DocCheckoutResponse {
  customerDocumentId: string;
  orderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string | null;
  title: string;
}

export function checkoutDocument(templateId: string, input: Record<string, unknown>) {
  return authFetch<DocCheckoutResponse>('/documents/checkout', {
    method: 'POST',
    body: JSON.stringify({ templateId, input }),
  });
}

export function verifyDocumentPayment(data: {
  customerDocumentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return authFetch<{ id: string; status: DocStatus }>('/documents/verify-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchMyDocuments() {
  return authFetch<MyDocument[]>('/documents/me');
}

export function fetchMyDocument(id: string) {
  return authFetch<MyDocument>(`/documents/me/${id}`);
}

// ---- admin ----

export interface AdminDocTemplate {
  id: string;
  title: string;
  slug: string;
  price: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  language: string;
  requiresStamp: boolean;
  updatedAt: string;
  category: { id: string; name: string };
  _count: { documents: number };
}

export interface AdminDocTemplateFull {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  keywords: string[];
  price: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  language: string;
  requiresStamp: boolean;
  stampBasis: string | null;
  schemaJson: { fields?: TemplateField[] } | null;
  bodyTemplate: string;
  category: { id: string; name: string };
}

export interface AdminDocOrder {
  id: string;
  status: DocStatus;
  amount: string | null;
  createdAt: string;
  paymentId: string | null;
  user: { email: string; fullName: string | null };
  template: { title: string };
}

export interface TemplateInput {
  categoryId: string;
  title: string;
  price: number;
  keywords?: string[];
  language?: string;
  requiresStamp?: boolean;
  stampBasis?: string;
  schemaJson: { fields: TemplateField[] };
  bodyTemplate: string;
}

export const fetchAdminDocCategories = () => authFetch<DocCategory[]>('/documents/admin/categories');
export const createDocCategory = (data: { name: string; description?: string }) =>
  authFetch<DocCategory>('/documents/admin/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateDocCategory = (id: string, data: { name?: string; description?: string }) =>
  authFetch<DocCategory>(`/documents/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const fetchAdminDocTemplates = () => authFetch<AdminDocTemplate[]>('/documents/admin/templates');
export const fetchAdminDocTemplate = (id: string) =>
  authFetch<AdminDocTemplateFull>(`/documents/admin/templates/${id}`);
export const createDocTemplate = (data: TemplateInput) =>
  authFetch<AdminDocTemplateFull>('/documents/admin/templates', { method: 'POST', body: JSON.stringify(data) });
export const updateDocTemplate = (id: string, data: Partial<TemplateInput>) =>
  authFetch<AdminDocTemplateFull>(`/documents/admin/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const setDocTemplateStatus = (id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') =>
  authFetch<AdminDocTemplateFull>(`/documents/admin/templates/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const fetchAdminDocOrders = (page = 1, pageSize = 20) =>
  authFetch<Paginated<AdminDocOrder>>(`/documents/admin/orders?page=${page}&pageSize=${pageSize}`);

// ---- backwards-compatible aliases (public browse page) ----
export type DocumentCategory = DocCategory;
export type DocumentTemplateItem = DocTemplateListItem;
export const getDocumentCategories = fetchDocCategories;
export const getDocumentTemplates = fetchDocTemplates;
