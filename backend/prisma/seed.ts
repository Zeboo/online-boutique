import { Audience, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Clothes",
    slug: "clothes",
    description: "Clothing and garments.",
    imageUrl:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=85",
    sortOrder: 1,
  },
  {
    name: "Shoes",
    slug: "shoes",
    description: "Footwear for every collection.",
    imageUrl:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    sortOrder: 2,
  },
  {
    name: "Bags",
    slug: "bags",
    description: "Handbags, totes, and carry pieces.",
    imageUrl:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=85",
    sortOrder: 3,
  },
];

const products = [
  {
    name: "Satin Slip Dress",
    slug: "satin-slip-dress",
    description:
      "An effortlessly elegant piece with a beautiful drape and considered details.",
    sku: "UC-LAD-001",
    price: "129.00",
    compareAtPrice: "169.00",
    imageUrl:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85",
    color: "Champagne",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 18,
    isActive: true,
    isFeatured: true,
    audience: Audience.LADIES,
  },
  {
    name: "The Sculpted Blazer",
    slug: "sculpted-blazer",
    description:
      "A confident, beautifully tailored layer made for workdays and everything after.",
    sku: "UC-GEN-001",
    price: "189.00",
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
    color: "Midnight",
    sizes: ["S", "M", "L", "XL"],
    stock: 12,
    isActive: true,
    isFeatured: true,
    audience: Audience.GENTS,
  },
  {
    name: "The Classic Top Handle",
    slug: "classic-top-handle",
    description:
      "A considered everyday companion with timeless proportions and thoughtful details.",
    sku: "UC-LAD-002",
    price: "249.00",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
    color: "Espresso",
    sizes: ["One size"],
    stock: 9,
    isActive: true,
    isFeatured: true,
    audience: Audience.LADIES,
  },
  {
    name: "Little Daydream Dress",
    slug: "little-daydream-dress",
    description:
      "A soft, easy-to-wear occasion dress made for birthday candles and sunny afternoons.",
    sku: "UC-KID-001",
    price: "58.00",
    imageUrl:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85",
    color: "Blush",
    sizes: ["2Y", "3Y", "4Y", "5Y", "6Y"],
    stock: 22,
    isActive: true,
    isFeatured: true,
    audience: Audience.KIDS,
  },
  {
    name: "Sculpted Leather Heel",
    slug: "sculpted-leather-heel",
    description:
      "A refined heel with a softly sculpted silhouette for all-day-to-evening wear.",
    sku: "UC-LAD-003",
    price: "159.00",
    imageUrl:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    color: "Black",
    sizes: ["36", "37", "38", "39", "40"],
    stock: 15,
    isActive: true,
    isFeatured: false,
    audience: Audience.LADIES,
  },
  {
    name: "The Weekend Trench",
    slug: "weekend-trench",
    description:
      "An enduring wardrobe layer in a soft, versatile sand tone.",
    sku: "UC-GEN-002",
    price: "219.00",
    imageUrl:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=85",
    color: "Sand",
    sizes: ["S", "M", "L", "XL"],
    stock: 7,
    isActive: true,
    isFeatured: true,
    audience: Audience.GENTS,
  },
];

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryIds.set(category.slug, saved.id);
  }

  for (const product of products) {
    const productText = `${product.name} ${product.description}`;
    const categorySlug = /(shoe|sneaker|trainer|boot|loafer|heel|sandal|slipper)/i.test(productText)
      ? "shoes"
      : /(bag|tote|backpack|clutch|handbag|purse|satchel|top handle)/i.test(productText)
        ? "bags"
        : "clothes";
    const categoryId = categoryIds.get(categorySlug);
    if (!categoryId) throw new Error(`Missing seeded category for ${categorySlug}`);
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, categoryId },
      create: { ...product, categoryId },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error("Could not seed the Umber Collection catalogue.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
