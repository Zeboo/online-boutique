"use client";

import { useState } from "react";
import type { Audience, DisplayProduct } from "@/app/lib/api";
import { Icon } from "../ui/Icon";
import { ProductGrid, ProductImage } from "./ProductGrid";

function price(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ProductDetails({
  product,
  relatedProducts,
  favorites,
  onFavorite,
  onAddToCart,
  onSelectProduct,
  onHome,
  onShop,
}: {
  product: DisplayProduct;
  relatedProducts: DisplayProduct[];
  favorites: string[];
  onFavorite: (productId: string) => void;
  onAddToCart: (product: DisplayProduct, size: string) => void;
  onSelectProduct: (product: DisplayProduct) => void;
  onHome: () => void;
  onShop: (audience: Audience) => void;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "One size");
  const categoryImage = relatedProducts.find((item) => item.category === product.category)?.image;
  const availableSizes = product.sizes.length ? product.sizes : ["One size"];

  return (
    <section className="product-detail-page">
      <div className="breadcrumbs product-breadcrumbs">
        <button type="button" onClick={onHome}>Home</button><span>/</span>
        <button type="button" onClick={() => onShop(product.category.toUpperCase() as Audience)}>{product.category}</button>
        <span>/</span><span>{product.name}</span>
      </div>
      <div className="product-detail">
        <div className="product-gallery">
          <div className="product-main-image"><ProductImage src={product.image} alt={product.name} priority className="detail-photo" /></div>
          <div className="gallery-thumbs">
            <div className="gallery-thumb selected"><ProductImage src={product.image} alt={`${product.name} view 1`} className="thumb-photo" /></div>
            {categoryImage && <div className="gallery-thumb"><ProductImage src={categoryImage} alt={`${product.category} collection`} className="thumb-photo" /></div>}
          </div>
        </div>
        <div className="product-info">
          <span className="eyebrow">{product.category} · The everyday edit</span>
          <h1>{product.name}</h1>
          <div className="detail-price">{price(product.price)}{product.oldPrice && <><del>{price(product.oldPrice)}</del><span className="sale-tag">Save {Math.round((1 - product.price / product.oldPrice) * 100)}%</span></>}</div>
          <p className="product-description">{product.description}</p>
          {product.color && <div className="detail-option"><span className="option-label">Color <strong>{product.color}</strong></span><div className="color-options"><span className="color-swatch swatch-champagne selected" /><span className="color-swatch swatch-sand" /><span className="color-swatch swatch-black" /></div></div>}
          {product.sizes.length > 0 && <div className="detail-option">
            <span className="option-label">Select size <button type="button" className="size-guide">Size guide</button></span>
            <div className="product-size-options">{availableSizes.map((size) => <button type="button" key={size} className={selectedSize === size ? "size-selected" : ""} onClick={() => setSelectedSize(size)}>{size}</button>)}</div>
          </div>}
          <span className={`stock-note ${product.stock === 0 ? "stock-unavailable" : ""}`}><span />{product.stock > 0 ? `${product.stock} in stock — ready to ship` : "Currently unavailable"}</span>
          <button type="button" className="button button-dark add-to-bag" disabled={product.stock < 1} onClick={() => onAddToCart(product, selectedSize)}>Add to bag <Icon name="bag" size={17} /><span>{price(product.price)}</span></button>
          <button type="button" className={`button button-wishlist ${favorites.includes(product.id) ? "wishlisted" : ""}`} onClick={() => onFavorite(product.id)}><Icon name="heart" size={17} />{favorites.includes(product.id) ? "Saved to your wishlist" : "Add to wishlist"}</button>
          <div className="detail-benefits"><div><Icon name="truck" size={17} /><span>Complimentary delivery over $150</span></div><div><Icon name="return" size={17} /><span>Easy, considered returns within 30 days</span></div><div><Icon name="shield" size={17} /><span>Secure checkout, always</span></div></div>
          <details className="detail-accordion"><summary>Product details <Icon name="chevron" size={16} /></summary><p>{product.description}</p></details>
          <details className="detail-accordion"><summary>Shipping & returns <Icon name="chevron" size={16} /></summary><p>Complimentary shipping on orders over $150. If it isn’t quite right, return it within 30 days in its original condition.</p></details>
          <details className="detail-accordion"><summary>Customer reviews <Icon name="chevron" size={16} /></summary><p>Verified product reviews will appear here after they are connected to the store.</p></details>
        </div>
      </div>
      <section className="section you-may-like">
        <div className="section-heading"><div><span className="eyebrow">A few more favorites</span><h2>You may also love</h2></div></div>
        <ProductGrid products={relatedProducts} favorites={favorites} onFavorite={onFavorite} onSelect={onSelectProduct} />
      </section>
    </section>
  );
}
