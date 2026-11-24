-- Categories describe product types (Clothes, Shoes, Bags).
-- Customer audience belongs to the product itself.
ALTER TABLE "Product" ADD COLUMN "audience" "Audience" NOT NULL DEFAULT 'GENTS';

UPDATE "Product" AS product
SET "audience" = category."audience"
FROM "Category" AS category
WHERE product."categoryId" = category."id";

UPDATE "Category"
SET "name" = 'Clothes', "slug" = 'clothes', "description" = 'Clothing and garments.', "sortOrder" = 1
WHERE "slug" = 'gents';

UPDATE "Category"
SET "name" = 'Bags', "slug" = 'bags', "description" = 'Handbags, totes, and carry pieces.', "sortOrder" = 3
WHERE "slug" = 'ladies';

UPDATE "Category"
SET "name" = 'Shoes', "slug" = 'shoes', "description" = 'Footwear for every collection.', "sortOrder" = 2
WHERE "slug" = 'kids';

UPDATE "Product"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'shoes')
WHERE ("name" || ' ' || "description") ~* '(shoe|sneaker|trainer|boot|loafer|heel|sandal|slipper)';

UPDATE "Product"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'bags')
WHERE ("name" || ' ' || "description") ~* '(bag|tote|backpack|clutch|handbag|purse|satchel)';

UPDATE "Product"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'clothes')
WHERE "categoryId" NOT IN (
  SELECT "id" FROM "Category" WHERE "slug" IN ('shoes', 'bags')
);

DROP INDEX "Category_audience_isActive_sortOrder_idx";
ALTER TABLE "Category" DROP COLUMN "audience";

CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX "Product_audience_isActive_idx" ON "Product"("audience", "isActive");
