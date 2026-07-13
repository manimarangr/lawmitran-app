-- Office address details + photos (docs/28 onboarding v2)
ALTER TABLE "LawyerOffice" ADD COLUMN "pincode" TEXT;
ALTER TABLE "LawyerOffice" ADD COLUMN "landmark" TEXT;
ALTER TABLE "LawyerOffice" ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
