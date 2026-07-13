-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('CLIENTS_CHOICE', 'TOP_RESPONDER', 'RISING_STAR');

-- CreateTable
CREATE TABLE "LawyerAward" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "type" "AwardType" NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "criteriaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawyerAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LawyerAward_lawyerId_type_year_key" ON "LawyerAward"("lawyerId", "type", "year");
CREATE INDEX "LawyerAward_lawyerId_idx" ON "LawyerAward"("lawyerId");

-- AddForeignKey
ALTER TABLE "LawyerAward" ADD CONSTRAINT "LawyerAward_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
