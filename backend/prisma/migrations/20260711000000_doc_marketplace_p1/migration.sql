-- Document marketplace Phase 1 (docs/11): lifecycle, slug, purchase snapshot
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "DocumentTemplate" ADD COLUMN "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "DocumentTemplate" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "DocumentTemplate" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "DocumentTemplate" ADD COLUMN "slug" TEXT;

-- Existing active templates were already live — keep them visible.
UPDATE "DocumentTemplate" SET "status" = 'PUBLISHED' WHERE "active" = true;
UPDATE "DocumentTemplate"
  SET "slug" = trim(BOTH '-' FROM regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g')) || '-' || substring("id", 1, 6)
  WHERE "slug" IS NULL;
ALTER TABLE "DocumentTemplate" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "DocumentTemplate_slug_key" ON "DocumentTemplate"("slug");

-- Purchase snapshot: the bought document never changes when the template does.
ALTER TABLE "CustomerDocument" ADD COLUMN "contentHtml" TEXT;
ALTER TABLE "CustomerDocument" ADD COLUMN "providerOrderId" TEXT;
ALTER TABLE "CustomerDocument" ADD COLUMN "amount" DECIMAL(10,2);
