ALTER TABLE "Order" ADD COLUMN "shippingCarrier" VARCHAR(40);

ALTER TABLE "OrderItem" ADD COLUMN "imageUrl" VARCHAR(2048);

UPDATE "OrderItem" AS item
SET "imageUrl" = product."imageUrl"
FROM "Product" AS product
WHERE item."productId" = product."id";

ALTER TABLE "OrderItem" ALTER COLUMN "imageUrl" SET NOT NULL;
