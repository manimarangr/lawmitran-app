import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '@prisma/client';

export const ADMIN_SCOPES_KEY = 'adminScopes';

/**
 * RBAC-lite: restrict an admin route to sub-roles. SUPER always passes.
 * `@AdminScopes()` (no args) = SUPER only; `@AdminScopes('FINANCE')` = SUPER + FINANCE.
 * Routes without the decorator are open to every admin.
 */
export const AdminScopes = (...scopes: AdminRole[]) =>
  SetMetadata(ADMIN_SCOPES_KEY, scopes);
