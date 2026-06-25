-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "providerOrderId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerOrderId_key" ON "Payment"("providerOrderId");

-- CreateIndex
CREATE INDEX "Payment_lawyerId_status_idx" ON "Payment"("lawyerId", "status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
