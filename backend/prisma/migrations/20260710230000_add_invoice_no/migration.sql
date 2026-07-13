-- GST invoice numbering (docs/10 compliance)
ALTER TABLE "Payment" ADD COLUMN "invoiceNo" TEXT;
CREATE UNIQUE INDEX "Payment_invoiceNo_key" ON "Payment"("invoiceNo");
