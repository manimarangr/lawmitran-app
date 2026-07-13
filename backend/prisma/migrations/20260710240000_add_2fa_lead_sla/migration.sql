-- Admin 2FA (email OTP) + lead SLA nudge tracking (docs/10)
ALTER TABLE "User" ADD COLUMN "adminOtpHash" TEXT;
ALTER TABLE "User" ADD COLUMN "adminOtpExpiresAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "slaNudgedAt" TIMESTAMP(3);
