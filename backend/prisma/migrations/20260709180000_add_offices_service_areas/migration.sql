-- AlterTable
ALTER TABLE "SubscriptionPlanPrice" ADD COLUMN "maxServiceAreas" INTEGER;

-- CreateTable
CREATE TABLE "LawyerOffice" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "label" TEXT,
    "addressLine" TEXT,
    "cityId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LawyerOffice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LawyerServiceArea" (
    "lawyerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LawyerServiceArea_pkey" PRIMARY KEY ("lawyerId","cityId")
);

-- CreateIndex
CREATE INDEX "LawyerOffice_lawyerId_idx" ON "LawyerOffice"("lawyerId");
CREATE INDEX "LawyerOffice_cityId_idx" ON "LawyerOffice"("cityId");
CREATE INDEX "LawyerServiceArea_cityId_active_idx" ON "LawyerServiceArea"("cityId", "active");

-- AddForeignKey
ALTER TABLE "LawyerOffice" ADD CONSTRAINT "LawyerOffice_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LawyerOffice" ADD CONSTRAINT "LawyerOffice_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LawyerServiceArea" ADD CONSTRAINT "LawyerServiceArea_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LawyerServiceArea" ADD CONSTRAINT "LawyerServiceArea_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every lawyer with a city gets one primary office + one active service area (docs/28)
INSERT INTO "LawyerOffice" ("id", "lawyerId", "label", "cityId", "latitude", "longitude", "isPrimary")
SELECT gen_random_uuid(), l."id", 'Main office', l."cityId", l."latitude", l."longitude", true
FROM "Lawyer" l
WHERE l."cityId" IS NOT NULL;

INSERT INTO "LawyerServiceArea" ("lawyerId", "cityId", "active")
SELECT l."id", l."cityId", true
FROM "Lawyer" l
WHERE l."cityId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Default plan caps (admin-editable): Basic 3, Premium 10
UPDATE "SubscriptionPlanPrice" SET "maxServiceAreas" = 3  WHERE "planName" = 'BASIC';
UPDATE "SubscriptionPlanPrice" SET "maxServiceAreas" = 10 WHERE "planName" = 'PREMIUM';
