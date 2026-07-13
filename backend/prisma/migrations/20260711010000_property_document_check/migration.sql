-- Property Document Check P0 (docs/29)
CREATE TYPE "PropertyCaseStatus" AS ENUM ('OPEN', 'ANALYZED', 'LAWYER_REVIEW', 'CLOSED');

CREATE TABLE "PropertyCase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "status" "PropertyCaseStatus" NOT NULL DEFAULT 'OPEN',
    "reportJson" JSONB,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyCase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PropertyCase_userId_status_idx" ON "PropertyCase"("userId", "status");
ALTER TABLE "PropertyCase" ADD CONSTRAINT "PropertyCase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PropertyCaseDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "provided" BOOLEAN NOT NULL DEFAULT true,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyCaseDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyCaseDocument_caseId_docType_key" ON "PropertyCaseDocument"("caseId", "docType");
ALTER TABLE "PropertyCaseDocument" ADD CONSTRAINT "PropertyCaseDocument_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "PropertyCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PropertyChecklist" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    CONSTRAINT "PropertyChecklist_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyChecklist_state_transactionType_key" ON "PropertyChecklist"("state", "transactionType");
