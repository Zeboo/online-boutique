"use client";

import Image from "next/image";
import type { DisplayProduct } from "@/app/lib/api";
import { Icon } from "../ui/Icon";

export function ProductImage({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 25vw"
      className={className}
    />
  );
}

export function ProductGrid({
  products,
  favorites,
  onFavorite,
  onSelect,
  onQuickAdd,
}: {
  products: DisplayProduct[];
  favorites: string[];
  onFavorite: (productId: string) => void;
  onSelect: (product: DisplayProduct) => void;
  onQuickAdd?: (product: DisplayProduct) => void;
}) {
  if (!products.length) {
    return (
      <div className="catalog-empty">
        <span className="eyebrow">A collection in the making</span>
        <p>New Umber pieces are being carefully selected. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <button
            type="button"
            className="product-card-image"
            onClick={() => onSelect(product)}
            aria-label={`View ${product.name}`}
          >
            <ProductImage src={product.image} alt={product.name} className="product-photo" />
            {product.badge && (
              <span className={`product-badge ${product.badge === "New" ? "badge-new" : ""}`}>
                {product.badge}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`favorite-button ${favorites.includes(product.id) ? "favorite-active" : ""}`}
            aria-label={
              favorites.includes(product.id)
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            onClick={() => onFavorite(product.id)}
          >
            <Icon name="heart" size={17} />
          </button>
          <div className="product-card-copy">
            <div className="product-card-title-row">
              <button
                type="button"
                className="product-card-name"
                onClick={() => onSelect(product)}
              >
                {product.name}
              </button>
            </div>
            <div className="product-card-subtitle">
              <span>{product.category}</span>
              <span>{product.color}</span>
            </div>
            <div className="product-card-price">
              <strong>${product.price.toFixed(2)}</strong>
              {product.oldPrice && <del>${product.oldPrice.toFixed(2)}</del>}
            </div>
            <button type="button" className="quick-add" onClick={() => onQuickAdd ? onQuickAdd(product) : onSelect(product)}>
              {onQuickAdd ? "Quick add" : "Discover the piece"} <Icon name="arrow" size={14} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
