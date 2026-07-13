-- RBAC-lite + richer audit trail (docs/10)
CREATE TYPE "AdminRole" AS ENUM ('SUPER', 'OPS', 'FINANCE');

ALTER TABLE "User" ADD COLUMN "adminRole" "AdminRole";

-- Existing admins become SUPER so nothing locks itself out.
UPDATE "User" SET "adminRole" = 'SUPER' WHERE "role" = 'ADMIN';

-- Evolve the existing AuditLog table to the richer shape.
DROP INDEX IF EXISTS "AuditLog_entity_entityId_idx";
ALTER TABLE "AuditLog" RENAME COLUMN "entity" TO "entityType";
ALTER TABLE "AuditLog" RENAME COLUMN "metaJson" TO "newValue";
ALTER TABLE "AuditLog" ALTER COLUMN "entityType" DROP NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "entityId" DROP NOT NULL;
ALTER TABLE "AuditLog" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AuditLog" ADD COLUMN "oldValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "ip" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
