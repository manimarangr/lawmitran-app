-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rating_leadId_key" ON "Rating"("leadId");

-- CreateIndex
CREATE INDEX "Rating_lawyerId_idx" ON "Rating"("lawyerId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
