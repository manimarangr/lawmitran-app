export type Role = 'CLIENT' | 'LAWYER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface Me {
  id: string;
  email: string;
  mobile: string;
  fullName: string | null;
  role: Role;
  adminRole?: 'SUPER' | 'OPS' | 'FINANCE' | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  marketingOptIn: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'LEAD_NEW'
  | 'LEAD_CONTACTED'
  | 'LEAD_CONFIRMED'
  | 'SUB_REMINDER'
  | 'SUB_EXPIRED'
  | 'SUB_ACTIVE'
  | 'REPORT_UPDATE'
  | string;

export interface AppNotification {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  type: NotificationType;
  payloadJson: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
