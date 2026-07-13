-- AI intake question log (docs/12 P1 — demand intelligence)
CREATE TABLE "AiIntakeLog" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "practiceArea" TEXT,
    "aiUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiIntakeLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiIntakeLog_topicKey_createdAt_idx" ON "AiIntakeLog"("topicKey", "createdAt");
CREATE INDEX "AiIntakeLog_matched_createdAt_idx" ON "AiIntakeLog"("matched", "createdAt");
