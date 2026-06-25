-- CreateTable
CREATE TABLE "SubscriptionPlanPrice" (
    "planName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlanPrice_pkey" PRIMARY KEY ("planName")
);

-- Seed default plan price (₹1000/month), editable later via the admin endpoint
INSERT INTO "SubscriptionPlanPrice" ("planName", "amount", "updatedAt")
VALUES ('STANDARD', 1000.00, CURRENT_TIMESTAMP);
