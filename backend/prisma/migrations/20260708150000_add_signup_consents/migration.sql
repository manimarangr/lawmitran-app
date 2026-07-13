-- AlterTable
ALTER TABLE "User" ADD COLUMN "fullName" TEXT,
ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "consentAt" TIMESTAMP(3),
ADD COLUMN "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
