"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/app/components/brand/BrandLogo";
import { Icon } from "@/app/components/ui/Icon";

type StoreHeaderProps = {
  activePage?: "home" | "shop" | "contact";
  onHome?: () => void;
  onShop?: () => void;
  onAudience?: (audience: "GENTS" | "LADIES" | "KIDS") => void;
  onNewArrivals?: () => void;
  onWishlist?: () => void;
  onCart?: () => void;
  onSearch?: (query: string) => void;
  searchOnSubmit?: boolean;
  wishlistCount?: number;
  cartCount?: number;
};

export function StoreHeader({ activePage, onHome, onShop, onAudience, onNewArrivals, onWishlist, onCart, onSearch, searchOnSubmit = false, wishlistCount = 0, cartCount = 0 }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    if (activePage === "home") window.scrollTo({ top: 0, behavior: "auto" });
    const updateHeader = () => {
      const heroScene = document.querySelector<HTMLElement>(".hero-scroll-scene");
      const nextSectionTop = heroScene ? heroScene.offsetTop + heroScene.offsetHeight : window.innerHeight;
      setHasScrolled(window.scrollY >= Math.max(nextSectionTop - 48, 260));
    };
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    return () => { window.removeEventListener("scroll", updateHeader); window.removeEventListener("resize", updateHeader); };
  }, [activePage]);
  const closeMenu = () => setMobileMenuOpen(false);
  const shop = () => { closeMenu(); onShop?.(); };
  const audience = (value: "GENTS" | "LADIES" | "KIDS") => { closeMenu(); onAudience?.(value); };
  const arrivals = () => { closeMenu(); onNewArrivals?.(); };

  return (
    <>
      <div className={`announcement${hasScrolled ? " announcement-hidden" : ""}`}>
        <span>Free Shipping on Orders Over $50</span>
        <span className="announcement-extra">Easy Returns within 30 Days</span>
        <span className="announcement-extra">24/7 Customer Support</span>
        {onShop ? <button type="button" className="announcement-link" onClick={shop}>Track Your Order <span aria-hidden="true">→</span></button> : <Link href="/contact?topic=order" className="announcement-link">Track Your Order <span aria-hidden="true">→</span></Link>}
      </div>
      <header className={`site-header${hasScrolled ? " site-header-scrolled" : ""}`}>
        {onShop && <button type="button" className="mobile-menu-button icon-button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="storefront-navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><Icon name={mobileMenuOpen ? "close" : "menu"} /></button>}
        <Link href="/" className="brand" aria-label="Style Ritual home"><BrandLogo className="brand-logo-image" /></Link>
        <nav id="storefront-navigation" className={`main-nav ${mobileMenuOpen ? "main-nav-open" : ""}`} aria-label="Main navigation">
          {onHome ? <button type="button" className={activePage === "home" ? "nav-active" : ""} onClick={() => { closeMenu(); onHome(); }}>Home</button> : <Link href="/" className="nav-link">Home</Link>}
          {onShop ? <button type="button" className={activePage === "shop" ? "nav-active" : ""} onClick={shop}>Shop</button> : <Link href="/?view=shop" className="nav-link">Shop</Link>}
          {onAudience ? <button type="button" onClick={() => audience("GENTS")}>Men</button> : <Link href="/?view=men" className="nav-link">Men</Link>}
          {onAudience ? <button type="button" onClick={() => audience("LADIES")}>Women</button> : <Link href="/?view=women" className="nav-link">Women</Link>}
          {onAudience ? <button type="button" onClick={() => audience("KIDS")}>Kids</button> : <Link href="/?view=kids" className="nav-link">Kids</Link>}
          {onNewArrivals ? <button type="button" onClick={arrivals}>New Arrivals</button> : <Link href="/#new-arrivals" className="nav-link">New Arrivals</Link>}
          {onShop ? <Link href="/contact" className="nav-link">Contact</Link> : <Link href="/contact" className={`nav-link ${activePage === "contact" ? "nav-active" : ""}`}>Contact</Link>}
        </nav>
        <div className="header-actions">
          {onSearch ? <label className="header-search"><input type="search" aria-label="Search products" placeholder="Search products..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); if (!searchOnSubmit) onSearch(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter" && searchOnSubmit) { event.preventDefault(); onSearch(searchQuery); } }} /><Icon name="search" /></label> : <Link href="/?view=search" className="icon-button" aria-label="Search"><Icon name="search" /></Link>}
          {onWishlist ? <button type="button" className="icon-button wishlist-trigger" aria-label={`Wishlist, ${wishlistCount} saved`} onClick={onWishlist}><Icon name="heart" />{wishlistCount > 0 && <span className="action-count">{wishlistCount}</span>}</button> : <Link href="/?view=wishlist" className="icon-button" aria-label="Wishlist"><Icon name="heart" /></Link>}
          {onCart ? <button type="button" className="icon-button bag-trigger" aria-label={`Shopping bag, ${cartCount} items`} onClick={onCart}><Icon name="bag" />{cartCount > 0 && <span className="action-count">{cartCount}</span>}</button> : <Link href="/?view=cart" className="icon-button" aria-label="Shopping bag"><Icon name="bag" /></Link>}
          <Link href="/account" className="icon-button account-trigger" aria-label="My account"><Icon name="user" /></Link>
        </div>
      </header>
    </>
  );
}
