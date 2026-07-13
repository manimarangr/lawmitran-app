-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('PAYMENT_ISSUE', 'ID_CARD_UPLOAD_ISSUE', 'ACCOUNT_ISSUE', 'SUBSCRIPTION_ISSUE', 'LEAD_ISSUE', 'VERIFICATION_ISSUE', 'TECHNICAL_ISSUE', 'OTHER');
CREATE TYPE "ContactQueryStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "ContactQuery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "category" "ContactCategory" NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactQueryStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactQuery_status_createdAt_idx" ON "ContactQuery"("status", "createdAt");
