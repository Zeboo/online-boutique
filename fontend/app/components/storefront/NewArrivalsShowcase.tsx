"use client";

import { useMemo } from "react";
import ClothingRailHero, { type GarmentKind, type RailGarment } from "@/components/ui/product-rail-gallery";
import type { DisplayProduct } from "@/app/lib/api";
import { ProductGrid } from "./ProductGrid";
import { ShoeCurveCarousel } from "./ShoeCurveCarousel";

type ArrivalCategory = "clothes" | "shoes" | "bags";
const shoePattern = /shoe|sneaker|trainer|boot|loafer|heel|sandal|slipper/i;
const bagPattern = /bag|tote|backpack|clutch|handbag|purse|satchel/i;
const productText = (product: DisplayProduct) => `${product.catalogCategory} ${product.name} ${product.category} ${product.description}`;

function garmentKind(product: DisplayProduct): GarmentKind {
  const text = productText(product);
  if (/coat|trench/i.test(text)) return "coat";
  if (/jacket|blazer|suit/i.test(text)) return "jacket";
  if (/hood/i.test(text)) return "hoodie";
  if (/shirt|blouse/i.test(text)) return "shirt";
  if (/knit|sweater|cardigan/i.test(text)) return "knit";
  return "tee";
}

function garmentColor(color: string) {
  const palette: Record<string, string> = {
    midnight: "#202735", sand: "#c8ae8e", champagne: "#d8c5a4", blush: "#d9a8a4",
    natural: "#d8cdbb", oatmeal: "#b9a98f", olive: "#687052", black: "#202020", ivory: "#e8e1d2",
  };
  return palette[color.toLowerCase()] ?? "#8b7767";
}

export function NewArrivalsShowcase({ products, favorites, onFavorite, onSelect, onQuickAdd, onShopCategory }: {
  products: DisplayProduct[];
  favorites: string[];
  onFavorite: (productId: string) => void;
  onSelect: (product: DisplayProduct) => void;
  onQuickAdd: (product: DisplayProduct) => void;
  onShopCategory: (category: ArrivalCategory) => void;
}) {
  const grouped = useMemo(() => {
    const shoes = products.filter((product) => shoePattern.test(productText(product)));
    const bags = products.filter((product) => bagPattern.test(productText(product)));
    const clothes = products.filter((product) => !shoePattern.test(productText(product)) && !bagPattern.test(productText(product)));
    return { clothes, shoes, bags };
  }, [products]);
  const garments = useMemo<RailGarment[]>(() => grouped.clothes.slice(0, 10).map((product) => ({
    id: product.id, name: product.name, description: product.description, kind: garmentKind(product), color: garmentColor(product.color),
    image: product.image, tag: `$${product.price.toFixed(2)}`, details: [product.category, product.color, ...product.sizes.slice(0, 3)],
  })), [grouped.clothes]);

  return (
    <section className="section product-section new-arrivals-showcase" aria-labelledby="new-arrivals-heading">
      <div className="new-arrivals-heading">
        <div><span className="eyebrow">Just landed</span><h2 id="new-arrivals-heading">New Arrivals</h2><span className="arrival-subtitle">Explore the latest clothes, shoes, and bags.</span></div>
      </div>
      <div className="arrival-category-block arrival-clothes">
        {garments.length ? <ClothingRailHero className="clothing-rail-transparent" items={garments} eyebrow="Clothes" heading="Fresh on the rail" hanger="wood" caption="Tailored layers and everyday pieces, presented from every angle." action={<button type="button" className="rail-explore-button" onClick={() => onShopCategory("clothes")}>Explore clothes <span aria-hidden="true">→</span></button>} autoplay={false} detailAction={(garment) => {
          const product = grouped.clothes.find((entry) => entry.id === garment.id);
          return product ? <button type="button" className="arrival-purchase-button" onClick={() => onQuickAdd(product)}>Add to bag · ${product.price.toFixed(2)}</button> : null;
        }} /> : <div className="catalog-empty"><p>New clothing is arriving soon.</p></div>}
      </div>
      <div className="arrival-category-block arrival-shoes">
        <ShoeCurveCarousel products={grouped.shoes} eyebrow="Shoes" heading="The newest step" action={<button type="button" onClick={() => onShopCategory("shoes")}>Explore shoes</button>} favorites={favorites} onFavorite={onFavorite} onSelect={onSelect} onQuickAdd={onQuickAdd} />
      </div>
      <div className="arrival-category-block arrival-bags">
        <div className="arrival-category-title"><div className="arrival-category-copy"><span>Bags</span><h3>Carry the season</h3><p>Considered companions with timeless proportions and useful details.</p></div><div className="arrival-category-actions"><span suppressHydrationWarning>{grouped.bags.length} new styles</span></div></div>
        <ProductGrid products={grouped.bags.slice(0, 5)} favorites={favorites} onFavorite={onFavorite} onSelect={onSelect} onQuickAdd={onQuickAdd} />
        <button type="button" className="bags-explore-button" onClick={() => onShopCategory("bags")}>Explore bags <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}
