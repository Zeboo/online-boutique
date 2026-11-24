"use client";

import { useRef, useState } from "react";
import type { DisplayProduct } from "@/app/lib/api";
import { Icon } from "../ui/Icon";
import { ProductImage } from "./ProductGrid";

export function ShoeCurveCarousel({ products, favorites, onFavorite, onSelect, onQuickAdd, eyebrow = "Shoes", heading = "The newest step", action }: {
  products: DisplayProduct[];
  favorites: string[];
  onFavorite: (productId: string) => void;
  onSelect: (product: DisplayProduct) => void;
  onQuickAdd: (product: DisplayProduct) => void;
  eyebrow?: string;
  heading?: string;
  action?: React.ReactNode;
}) {
  const shoes = products.slice(0, 7);
  const [selected, setSelected] = useState(0);
  const hoverMoveAt = useRef(0);
  const activeIndex = shoes.length ? selected % shoes.length : 0;
  const active = shoes[activeIndex];

  if (!active) return <div className="catalog-empty"><p>New shoes are arriving soon.</p></div>;

  const move = (direction: number) => setSelected((current) => (current + direction + shoes.length) % shoes.length);
  const relativePosition = (index: number) => {
    let offset = index - activeIndex;
    if (offset > shoes.length / 2) offset -= shoes.length;
    if (offset < -shoes.length / 2) offset += shoes.length;
    return offset;
  };

  return (
    <div className={`shoe-curve ${shoes.length === 1 ? "shoe-curve-single" : ""}`} onKeyDown={(event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    }}>
      <header className="shoe-curve-heading">
        <div><span>{eyebrow}</span><h3>{heading}</h3><p>Refined silhouettes designed to move through every part of the day.</p></div>
        {action}
      </header>
      <div className="shoe-curve-stage" role="region" aria-roledescription="carousel" aria-label="New arrival shoes" tabIndex={0} onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const edge = (event.clientX - bounds.left) / bounds.width;
        const now = Date.now();
        if (now - hoverMoveAt.current < 700) return;
        if (edge < 0.2) { hoverMoveAt.current = now; move(-1); }
        else if (edge > 0.8) { hoverMoveAt.current = now; move(1); }
      }}>
        <div className="shoe-curve-floor" aria-hidden="true" />
        {shoes.map((shoe, index) => {
          const offset = relativePosition(index);
          const distance = Math.abs(offset);
          const visible = distance <= 3;
          return <article
            key={shoe.id}
            className={`shoe-curve-card ${offset === 0 ? "shoe-curve-active" : ""}`}
            aria-hidden={!visible}
            style={{
              "--shoe-x": `${offset * 205}px`,
              "--shoe-z": `${-distance * 155}px`,
              "--shoe-y": `${distance * 26}px`,
              "--shoe-rotate": `${offset * -18}deg`,
              "--shoe-scale": `${Math.max(.68, 1 - distance * .12)}`,
              "--shoe-opacity": `${visible ? Math.max(.28, 1 - distance * .24) : 0}`,
              zIndex: 20 - distance,
              pointerEvents: visible ? "auto" : "none",
            } as React.CSSProperties}
          >
            <button type="button" className="shoe-curve-image" onClick={() => offset === 0 ? onSelect(shoe) : setSelected(index)} aria-label={offset === 0 ? `View ${shoe.name}` : `Show ${shoe.name}`}>
              <ProductImage src={shoe.image} alt={shoe.name} className="shoe-curve-photo" />
              {offset === 0 && <span className="shoe-curve-view">View details</span>}
            </button>
          </article>;
        })}
        {shoes.length > 1 && <><button type="button" className="shoe-curve-control shoe-curve-prev" aria-label="Previous shoe" onClick={() => move(-1)}><Icon name="chevron" /></button><button type="button" className="shoe-curve-control shoe-curve-next" aria-label="Next shoe" onClick={() => move(1)}><Icon name="chevron" /></button></>}
      </div>

      <div className="shoe-curve-details" aria-live="polite">
        <div>
          <span className="eyebrow">{active.category} · {active.color}</span>
          <button type="button" className="shoe-curve-name" onClick={() => onSelect(active)}>{active.name}</button>
          <p>{active.description}</p>
          <div className="shoe-curve-sizes">{active.sizes.slice(0, 5).map((size) => <span key={size}>{size}</span>)}</div>
        </div>
        <div className="shoe-curve-buy">
          <div><strong>${active.price.toFixed(2)}</strong>{active.oldPrice && <del>${active.oldPrice.toFixed(2)}</del>}</div>
          <button type="button" className={`shoe-curve-heart ${favorites.includes(active.id) ? "shoe-curve-heart-active" : ""}`} aria-label={favorites.includes(active.id) ? `Remove ${active.name} from wishlist` : `Add ${active.name} to wishlist`} onClick={() => onFavorite(active.id)}><Icon name="heart" /></button>
          <button type="button" className="shoe-curve-add" onClick={() => onQuickAdd(active)}>Quick add</button>
        </div>
      </div>
      {shoes.length > 1 && <div className="shoe-curve-dots" role="group" aria-label="Choose a shoe">{shoes.map((shoe, index) => <button type="button" key={shoe.id} aria-label={`Show ${shoe.name}`} aria-current={index === activeIndex} onClick={() => setSelected(index)} />)}</div>}
    </div>
  );
}
