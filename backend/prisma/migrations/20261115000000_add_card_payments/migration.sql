ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CARD';

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeSessionId" VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
