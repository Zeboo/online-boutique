"use client";

import { useEffect, useMemo, useState } from "react";
import { StoreHeader } from "@/app/components/storefront/StoreHeader";
import { StoreFooter } from "@/app/components/storefront/StoreFooter";
import { Newsletter } from "@/app/components/storefront/Newsletter";
import { NewArrivalsShowcase } from "@/app/components/storefront/NewArrivalsShowcase";
import { ProductGrid, ProductImage } from "@/app/components/storefront/ProductGrid";
import { ProductDetails } from "@/app/components/storefront/ProductDetails";
import { CheckoutPanel, type CheckoutOrder } from "@/app/components/storefront/CheckoutPanel";
import { HeroVideo } from "@/app/components/storefront/HeroVideo";
import { Icon } from "@/app/components/ui/Icon";
import { Reveal } from "@/app/components/ui/Reveal";
import { ScrollReveal } from "@/app/components/ui/ScrollReveal";
import { CinematicAtmosphere } from "@/app/components/ui/CinematicAtmosphere";
import {
  apiRequest,
  toDisplayProduct,
  type Audience,
  type CategoryRecord,
  type DisplayProduct,
  type ProductRecord,
} from "@/app/lib/api";

type CategoryFilter = "All" | `audience:${Audience}` | `category:${string}`;
type Screen = "home" | "shop" | "product" | "wishlist" | "cart" | "checkout";
type Product = DisplayProduct;
type CartLine = { productId: string; quantity: number; size: string };
type CmsBanner = { eyebrow: string; heading: string; body: string; imageUrl: string; href: string };

const fallbackProducts: Product[] = [
  { id: "demo-linen-shirt", name: "Relaxed Linen Shirt", slug: "relaxed-linen-shirt", category: "Gents", categoryId: "demo-gents", price: 42, oldPrice: 58, image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85", color: "Natural", badge: "New", description: "An easy linen shirt for warm days and slow weekends.", sizes: ["S", "M", "L", "XL"], stock: 12, isActive: true, isFeatured: true },
  { id: "demo-knitwear", name: "Soft Knit Sweater", slug: "soft-knit-sweater", category: "Ladies", categoryId: "demo-ladies", price: 64, oldPrice: 82, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85", color: "Oatmeal", badge: "Bestseller", description: "A soft, versatile knit with a relaxed everyday fit.", sizes: ["XS", "S", "M", "L"], stock: 9, isActive: true, isFeatured: true },
  { id: "demo-sneakers", name: "Everyday Leather Sneakers", slug: "everyday-leather-sneakers", category: "Gents", categoryId: "demo-gents", price: 78, oldPrice: 96, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", color: "Ivory", badge: "New", description: "Clean leather sneakers made for everyday miles.", sizes: ["S", "M", "L", "XL"], stock: 15, isActive: true, isFeatured: true },
  { id: "demo-jacket", name: "Quilted Weekend Jacket", slug: "quilted-weekend-jacket", category: "Gents", categoryId: "demo-gents", price: 92, oldPrice: 120, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85", color: "Olive", badge: "Bestseller", description: "A lightweight layer with considered details and useful pockets.", sizes: ["S", "M", "L", "XL"], stock: 7, isActive: true, isFeatured: true },
];
const fallbackCategories: CategoryRecord[] = [
  { id: "demo-ladies", audience: "LADIES", name: "WomenÃ¢â‚¬â„¢s Clothing", slug: "womens-clothing", description: "Everyday favourites", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80", isActive: true, sortOrder: 1 },
  { id: "demo-gents", audience: "GENTS", name: "MenÃ¢â‚¬â„¢s Clothing", slug: "mens-clothing", description: "Easy, considered style", imageUrl: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80", isActive: true, sortOrder: 2 },
  { id: "demo-kids", audience: "KIDS", name: "Shoes & Accessories", slug: "shoes-accessories", description: "Finishing touches", imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80", isActive: true, sortOrder: 3 },
];
const homeCategoryTiles = [
  { title: "Womenâ€™s Clothing", image: "photo-1483985988355-763728e1935b", audience: "LADIES" as Audience },
  { title: "Menâ€™s Clothing", image: "photo-1516257984-b1b4d707412e", audience: "GENTS" as Audience },
  { title: "Shoes", image: "photo-1542291026-7eec264c27ff", audience: "GENTS" as Audience },
  { title: "Jackets", image: "photo-1551028719-00167b16eac5", audience: "GENTS" as Audience },
  { title: "Coats", image: "photo-1539533018447-63fcce2678e3", audience: "LADIES" as Audience },
  { title: "Bags", image: "photo-1548036328-c9fa89d128fa", audience: "LADIES" as Audience },
  { title: "Caps & Hats", image: "photo-1521369909029-2afed882baee", audience: "GENTS" as Audience },
  { title: "Accessories", image: "photo-1611652022419-a9419f74343d", audience: "LADIES" as Audience },
];
const audienceLabels: Record<Audience, string> = { GENTS: "Men", LADIES: "Women", KIDS: "Kids" };
const reviewData = [
  ["photo-1534528741775-53994a69daeb", "Sarah Johnson", "Amazing quality and super fast delivery. Every piece feels considered.", "Verified buyer"],
  ["photo-1500648767791-00dcc994a43e", "David Smith", "A refined collection, excellent service, and a beautifully simple checkout.", "Verified buyer"],
  ["photo-1534528741775-53994a69daeb", "Emily Davis", "Beautiful designs and great prices. I will absolutely shop here again.", "Verified buyer"],
  ["photo-1500648767791-00dcc994a43e", "Noah Williams", "The fit was perfect and delivery was quicker than expected.", "Verified buyer"],
] as const;

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export default function Boutique() {
  const [screen, setScreen] = useState<Screen>("home");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [activeAudience, setActiveAudience] = useState<Audience | "All">("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [sortBy, setSortBy] = useState("Featured");
  const [sizeFilter, setSizeFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState(300);
  const [priceFilterDisabled, setPriceFilterDisabled] = useState(true);
  const [reviewOffset, setReviewOffset] = useState(0);
  const [newOnly, setNewOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const [saleOnly, setSaleOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartNotice, setCartNotice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [heroBanner, setHeroBanner] = useState<CmsBanner | null>(null);
  const [shopBanner, setShopBanner] = useState<CmsBanner | null>(null);
  const [cmsError, setCmsError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<CheckoutOrder | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get("order");
    if (params.get("payment") !== "success" || !orderNumber) return;
    apiRequest<CheckoutOrder>(`/orders/${encodeURIComponent(orderNumber)}`)
      .then((order) => { setScreen("checkout"); setOrderPlaced(order); setCart([]); window.history.replaceState({}, "", window.location.pathname); })
      .catch((error) => console.error("Could not load the paid order receipt.", error));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      const audience = params.get("audience");
      if (view === "shop" || audience) {
        setScreen("shop");
        setActiveAudience(audience === "GENTS" || audience === "LADIES" || audience === "KIDS" ? audience : "All");
        setActiveCategory("All");
      } else if (view === "men" || view === "women" || view === "kids") {
        setScreen("shop");
        setActiveAudience(view === "men" ? "GENTS" : view === "women" ? "LADIES" : "KIDS");
        setActiveCategory("All");
      } else if (view === "wishlist" || view === "cart") {
        setScreen(view);
      } else if (view === "search") {
        setSearchQuery(params.get("q") ?? "");
        setScreen("shop");
      } else if (view === "new-arrivals") {
        setScreen("home");
        window.setTimeout(() => document.querySelector(".product-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      }
    });
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("checkout") === "1") queueMicrotask(() => setScreen("checkout"));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<ProductRecord[]>("/products?limit=100"),
      apiRequest<CategoryRecord[]>("/categories"),
    ])
      .then(([productRecords, categoryRecords]) => {
        if (!active) return;
        setProducts(productRecords.length ? productRecords.map(toDisplayProduct) : fallbackProducts);
        setCategories(categoryRecords.length ? categoryRecords : fallbackCategories);
        setCatalogError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load the Umber Collection storefront catalog.", error);
        setCatalogError(
          error instanceof Error ? error.message : "The collection could not be loaded.",
        );
        setProducts(fallbackProducts);
        setCategories(fallbackCategories);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<CmsBanner[]>("/cms/banners")
      .then((banners) => {
        if (active) {
          setHeroBanner(banners.find((banner) => banner.href === "/") ?? null);
          setShopBanner(banners.find((banner) => banner.href === "/shop") ?? null);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load Umber Collection banners.", error);
        setCmsError(error instanceof Error ? error.message : "The homepage banner could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem("online-boutique-cart");
      const savedFavorites = window.localStorage.getItem("online-boutique-favorites");
      const restoredCart = savedCart ? (JSON.parse(savedCart) as CartLine[]) : null;
      const restoredFavorites = savedFavorites ? (JSON.parse(savedFavorites) as string[]) : null;
      queueMicrotask(() => {
        if (restoredCart) setCart(restoredCart);
        if (restoredFavorites) setFavorites(restoredFavorites);
        setStorageReady(true);
      });
    } catch (error) {
      console.error("Could not restore the saved boutique shopping state.", error);
      queueMicrotask(() => setStorageReady(true));
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem("online-boutique-cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save the boutique cart.", error);
    }
  }, [cart, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem("online-boutique-favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Could not save the boutique wishlist.", error);
    }
  }, [favorites, storageReady]);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesAudience = activeAudience === "All" || product.audience === activeAudience;
      const matchesCategory = activeCategory === "All"
        || (activeCategory.startsWith("audience:") && (product.audience ?? product.category.toUpperCase()) === activeCategory.slice(9))
        || (activeCategory.startsWith("category:") && product.categoryId === activeCategory.slice(9));
      const matchesSearch = !query || `${product.name} ${product.category} ${product.catalogCategory ?? ""} ${product.color}`.toLowerCase().includes(query);
      const matchesSize = !sizeFilter || product.sizes.includes(sizeFilter);
      const matchesPrice = priceFilterDisabled || product.price <= maxPrice;
      const matchesNew = !newOnly || product.badge === "New";
      const matchesBest = !bestOnly || product.badge === "Bestseller" || product.isFeatured;
      const matchesSale = !saleOnly || Boolean(product.oldPrice && product.oldPrice > product.price);
      return matchesAudience && matchesCategory && matchesSearch && matchesSize && matchesPrice && matchesNew && matchesBest && matchesSale;
    });

    if (sortBy === "Price: low to high") return filtered.sort((a, b) => a.price - b.price);
    if (sortBy === "Price: high to low") return filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }, [activeAudience, activeCategory, bestOnly, maxPrice, newOnly, priceFilterDisabled, products, saleOnly, searchQuery, sizeFilter, sortBy]);

  const categoryTiles = useMemo(() => {
    const activeCategories = categories.filter((entry) => entry.isActive);
    if (!activeCategories.length) return homeCategoryTiles;
    return activeCategories.map((entry, index) => ({
      id: entry.id,
      title: entry.name,
      image: homeCategoryTiles[index % homeCategoryTiles.length].image,
      audience: entry.audience ?? homeCategoryTiles[index % homeCategoryTiles.length].audience,
      imageUrl: products.find((product) => product.categoryId === entry.id || product.category.toLowerCase() === entry.name.toLowerCase() || product.catalogCategory?.toLowerCase() === entry.name.toLowerCase())?.image || entry.imageUrl || null,
    }));
  }, [categories, products]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return total + (product?.price ?? 0) * item.quantity;
  }, 0);

  function navigate(nextScreen: Screen) {
    setScreen(nextScreen);
    setSearchOpen(false);
    setOrderPlaced(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showAudience(audience: Audience) {
    setActiveAudience(audience);
    setActiveCategory("All");
    setSearchQuery("");
    setSizeFilter("");
    setNewOnly(false);
    setBestOnly(false);
    setSaleOnly(false);
    setMaxPrice(300);
    navigate("shop");
  }

  function goToArrivals() {
    if (screen !== "home") {
      setScreen("home");
      window.setTimeout(() => document.querySelector(".product-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      return;
    }
    document.querySelector(".product-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openProduct(product: Product) {
    setSelectedProductId(product.id);
    navigate("product");
  }

  function followHeroLink() {
    const href = heroBanner?.href ?? "/shop";
    if (href === "/shop") {
      setActiveCategory("All");
      navigate("shop");
    } else if (href.startsWith("/content/")) {
      window.location.assign(href);
    } else {
      navigate("shop");
    }
  }

  function toggleFavorite(productId: string) {
    setFavorites((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }

  function addToCart(product: Product, size = "One size") {
    const existing = cart.find((item) => item.productId === product.id && item.size === size);
    if (product.stock < 1 || (existing && existing.quantity >= Math.min(product.stock, 10))) {
      setCartNotice("The available quantity for this piece is already in your bag.");
      navigate("cart");
      return;
    }
    setCartNotice("");
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.size === size);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { productId: product.id, quantity: 1, size }];
    });
    navigate("cart");
  }

  function updateQuantity(productId: string, size: string, delta: number) {
    if (delta > 0) {
      const product = products.find((entry) => entry.id === productId);
      const currentItem = cart.find((item) => item.productId === productId && item.size === size);
      if (product && currentItem && currentItem.quantity >= Math.min(product.stock, 10)) {
        setCartNotice("The available quantity for this piece is already in your bag.");
        return;
      }
    }
    setCartNotice("");
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  return (
    <main>
      <CinematicAtmosphere />
      <StoreHeader
        activePage={screen === "home" || screen === "shop" ? screen : undefined}
        onHome={() => navigate("home")}
        onShop={() => { setActiveAudience("All"); setActiveCategory("All"); navigate("shop"); }}
        onAudience={showAudience}
        onNewArrivals={goToArrivals}
        onWishlist={() => navigate("wishlist")}
        onCart={() => navigate("cart")}
        onSearch={(query) => { setSearchQuery(query); if (query) setScreen("shop"); }}
        wishlistCount={favorites.length}
        cartCount={cartCount}
      />

      {catalogError && <div className="catalog-error" role="alert">{catalogError}</div>}
      {cmsError && <div className="catalog-error" role="alert">{cmsError}</div>}
      {catalogLoading && products.length === 0 && <div className="catalog-loading" role="status">Loading the collectionÃ¢â‚¬Â¦</div>}

      {searchOpen && (
        <div className="search-panel">
          <Icon name="search" size={19} />
          <input
            aria-label="Search the collection"
            autoFocus
            placeholder="Search the collection..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }}
          />
          <button type="button" className="icon-button" aria-label="Close search" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            <Icon name="close" />
          </button>
        </div>
      )}

      {screen === "home" && (
        <>
          <div className="home-page">
          <div className="hero-scroll-scene">
            <section className="hero">
              <HeroVideo src={heroBanner?.imageUrl} />
              <div className="hero-shade" />
              <div className="hero-content">
                <span className="eyebrow eyebrow-light">{heroBanner?.eyebrow ?? "New Collection"}</span>
                {heroBanner ? <h1>{heroBanner.heading}</h1> : <h1>Elevate Your<br /><em>Style</em></h1>}
                <p>{heroBanner?.body ?? "Discover the latest fashion for ladies & gents â€” clothing, shoes and jackets."}</p>
                <button type="button" className="button button-gold" onClick={followHeroLink}>
                  Shop the collection <Icon name="arrow" size={16} />
                </button>
              </div>
              <div className="hero-index"><span>Scroll</span><i /><span className="hero-progress">Film</span></div>
              <button type="button" className="hero-next" aria-label="Browse collection" onClick={() => navigate("shop")}><Icon name="arrow" /></button>
            </section>
          </div>

          <section className="promo-row" aria-label="Featured offers">
            <button type="button" className="promo-card promo-winter" onClick={() => { setActiveAudience("GENTS"); setActiveCategory("All"); navigate("shop"); }}>
              <span>Winter Collection</span><strong>Up to 50% OFF</strong><small>Stay warm, stay stylish</small><b>Shop Jackets <Icon name="arrow" size={13} /></b>
            </button>
            <button type="button" className="promo-card promo-shoes" onClick={() => { setActiveCategory("All"); setSearchQuery("shoe"); navigate("shop"); }}>
              <span>Step into Comfort</span><strong>Premium Shoes<br />Up to 40% OFF</strong><b>Shop Shoes <Icon name="arrow" size={13} /></b>
            </button>
          </section>

          <Reveal className="collection-scene">
            <section className="section collection-section">
              <div className="section-heading">
                <div><span className="eyebrow">Explore the collection</span><h2>Shop by category</h2><span className="arrival-subtitle">Curated edits for every kind of day.</span></div>
                <button type="button" className="text-link" onClick={() => { setActiveCategory("All"); navigate("shop"); }}>View All <Icon name="arrow" size={15} /></button>
              </div>
              <div className="category-grid">
              {[...categoryTiles, ...categoryTiles, ...categoryTiles, ...categoryTiles].map((category, index) => (
                  <button
                    type="button"
                    key={`${category.title}-${index}`}
                    className={`category-card category-card-${index + 1}`}
                    style={{ "--category-delay": `${index * 180}ms` } as React.CSSProperties}
                    onClick={() => { const categoryId = "id" in category ? category.id : ""; setActiveAudience(categoryId ? "All" : category.audience); setActiveCategory(categoryId ? `category:${categoryId}` : "All"); navigate("shop"); }}
                  >
                  <ProductImage src={("imageUrl" in category && typeof category.imageUrl === "string" && category.imageUrl) || "/umber-collection-logo.svg"} alt={String(category.title)} className="category-photo" />
                  <span className="category-overlay" />
                  <span className="category-copy"><span>Explore the collection</span><strong>{category.title}</strong><i>Shop now <Icon name="arrow" size={14} /></i></span>
                  </button>
              ))}
              </div>
            </section>
          </Reveal>

          <ScrollReveal className="editorial-scene">
          <section className="editorial-banner" id="our-story">
            <div className="editorial-image">
              <ProductImage src="https://images.unsplash.com/photo-1782569869989-9500bc4159c2?auto=format&fit=crop&w=1800&q=85" alt="A quiet moment from our latest campaign" className="editorial-photo" />
            </div>
            <div className="editorial-content">
              <span className="eyebrow eyebrow-light">Less, but better</span>
              <h2>Luxury,<br /><em>redefined.</em></h2>
              <p>Thoughtful design, enduring materials, and the little details that make a piece yours.</p>
              <button type="button" className="button button-outline-light" onClick={() => { setActiveCategory("All"); navigate("shop"); }}>
                Our point of view <Icon name="arrow" size={16} />
              </button>
            </div>
          </section>
          </ScrollReveal>

          <ScrollReveal className="product-scene">
            <NewArrivalsShowcase
              products={products.length ? products : fallbackProducts}
              favorites={favorites}
              onFavorite={toggleFavorite}
              onSelect={openProduct}
              onQuickAdd={(product) => addToCart(product, product.sizes[0] ?? "One size")}
              onShopCategory={(category) => {
                setSearchQuery(category === "clothes" ? "" : category === "shoes" ? "shoe" : "bag");
                setActiveCategory("All");
                navigate("shop");
              }}
            />
          </ScrollReveal>

          <section className="home-trust-reviews" aria-label="Customer reviews and store benefits">
            <div className="service-strip" aria-label="Our service promises">
              <div className="service-item"><Icon name="truck" /><div><strong>Free Shipping</strong><span>On Orders Over $50</span></div></div>
              <div className="service-item"><Icon name="shield" /><div><strong>Secure Payments</strong><span>100% Secure Checkout</span></div></div>
              <div className="service-item"><Icon name="undo" /><div><strong>Easy Returns</strong><span>Within 30 Days</span></div></div>
              <div className="service-item"><Icon name="support" /><div><strong>24/7 Support</strong><span>Always Here to Help</span></div></div>
            </div>
            <section className="testimonials" aria-labelledby="customer-reviews-heading" data-review-offset={reviewOffset}>
              <div className="section-heading">
                <div><h2 id="customer-reviews-heading">What Our Customers Say</h2><span className="arrival-subtitle">Real reviews from our happy customers.</span></div>
                <div className="testimonial-arrows"><button type="button" aria-label="Previous review" onClick={() => setReviewOffset((current) => (current - 1 + reviewData.length) % reviewData.length)}><Icon name="chevron" className="review-chevron-left" size={19} /></button><button type="button" aria-label="Next review" onClick={() => setReviewOffset((current) => (current + 1) % reviewData.length)}><Icon name="chevron" className="review-chevron-right" size={19} /></button></div>
              </div>
              <div className="testimonial-grid">
                {[["photo-1534528741775-53994a69daeb", "Sarah Johnson", "Amazing quality and super fast delivery! Iï¿½m really happy with my purchase."], ["photo-1500648767791-00dcc994a43e", "David Smith", "Stylish collection and excellent customer service. Highly recommended!"], ["photo-1534528741775-53994a69daeb", "Emily Davis", "Beautiful designs and great prices. Will shop again for sure!"]].map(([image, name, quote]) => <article className="testimonial-card" key={name}><ProductImage src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=180&q=85`} alt={`${name}, customer`} className="testimonial-avatar" /><div><p>ï¿½{quote}ï¿½</p><strong>{name}</strong><span>{"★".repeat(5)}</span></div></article>)}
              </div>
            </section>            <ScrollReveal className="newsletter-scene"><Newsletter /></ScrollReveal>
          </section>
          </div>
        </>
      )}

      {screen === "shop" && (
        <section className="shop-page">
              <div
                className={`shop-banner${shopBanner ? " shop-banner-cms" : ""}`}
                style={shopBanner ? {
                  backgroundImage: `linear-gradient(180deg, rgba(12, 10, 9, .42) 0%, rgba(12, 10, 9, .28) 48%, rgba(12, 10, 9, .42) 100%), url("${shopBanner.imageUrl}")`,
                } : undefined}
              >
            <div>
              <span className="eyebrow">{shopBanner?.eyebrow ?? "A little something for every day"}</span>
              <h1>{shopBanner?.heading ?? "Our collection"}</h1>
              <p>{shopBanner?.body ?? "Discover the pieces you&apos;ll reach for again and again."}</p>
              <div className="breadcrumbs"><button type="button" onClick={() => navigate("home")}>Home</button><span>/</span><span>Shop</span></div>
            </div>
            {!shopBanner && <div className="shop-banner-image"><ProductImage src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85" alt="Spring collection campaign" className="shop-banner-photo" /></div>}
          </div>
          <div className="shop-layout">
            <aside className="shop-sidebar">
              <div className="sidebar-title"><span>Categories</span><Icon name="filter" size={17} /></div>
              <div className="category-filter">
                <div className="sidebar-filter-label">Customer group</div>
                {(["All", "GENTS", "LADIES", "KIDS"] as const).map((audience) => (
                  <button type="button" key={audience} className={activeAudience === audience && activeCategory === "All" ? "filter-active" : ""} onClick={() => { setActiveAudience(audience); setActiveCategory("All"); }}>
                    <span>{audience === "All" ? "All customers" : audienceLabels[audience]}</span><span>{audience === "All" ? products.length : products.filter((product) => product.audience === audience).length}</span>
                  </button>
                ))}
                <div className="sidebar-filter-label">Product category</div>
                {(["All", ...categories.filter((entry) => entry.isActive).map((entry) => `category:${entry.id}` as const)] as CategoryFilter[]).map((category) => (
                  <button type="button" key={category} className={activeCategory === category ? "filter-active" : ""} onClick={() => setActiveCategory(category)}>
                    <span>{category === "All" ? "All pieces" : categories.find((entry) => `category:${entry.id}` === category)?.name}</span><span>{category === "All" ? products.length : products.filter((product) => `category:${product.categoryId}` === category).length}</span>
                  </button>
                ))}
              </div>
              <div className="sidebar-rule" />
              <span className="sidebar-title">Price range</span>
              <input aria-label="Maximum price" className="price-range" type="range" min="0" max="300" step="10" value={maxPrice} disabled={priceFilterDisabled} onChange={(event) => setMaxPrice(Number(event.target.value))} />
              <div className="price-labels"><span>$0</span><span>Up to ${maxPrice}</span></div>
              <label className="checkbox-filter price-filter-toggle"><input type="checkbox" checked={priceFilterDisabled} onChange={(event) => setPriceFilterDisabled(event.target.checked)} /> Disable price filter</label>
              <div className="sidebar-rule" />
              <span className="sidebar-title">Size</span>
              <div className="size-filter">{["XS", "S", "M", "L", "XL"].map((size) => <button type="button" key={size} className={sizeFilter === size ? "filter-selected" : ""} aria-pressed={sizeFilter === size} onClick={() => setSizeFilter(sizeFilter === size ? "" : size)}>{size}</button>)}</div>
              <div className="sidebar-rule" />
              <span className="sidebar-title">The edit</span>
              <label className="checkbox-filter"><input type="checkbox" checked={newOnly} onChange={(event) => setNewOnly(event.target.checked)} /> New arrivals</label>
              <label className="checkbox-filter"><input type="checkbox" checked={bestOnly} onChange={(event) => setBestOnly(event.target.checked)} /> Bestsellers</label>
              <label className="checkbox-filter"><input type="checkbox" checked={saleOnly} onChange={(event) => setSaleOnly(event.target.checked)} /> On sale</label>
              <button type="button" className="reset-shop-filters" onClick={() => { setActiveAudience("All"); setActiveCategory("All"); setMaxPrice(300); setPriceFilterDisabled(true); setSizeFilter(""); setNewOnly(false); setBestOnly(false); setSaleOnly(false); setSearchQuery(""); }}>Clear all filters</button>
            </aside>
            <div className="shop-results">
              <div className="shop-toolbar">
                <span><strong>{visibleProducts.length}</strong> pieces to love</span>
                <div className="toolbar-controls">
                  <label htmlFor="sort-products">Sort by</label>
                  <select id="sort-products" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option>Featured</option>
                    <option>Price: low to high</option>
                    <option>Price: high to low</option>
                  </select>
                </div>
              </div>
              {visibleProducts.length > 0 ? (
                <ProductGrid products={visibleProducts} favorites={favorites} onFavorite={toggleFavorite} onSelect={openProduct} onQuickAdd={(product) => addToCart(product, product.sizes[0] ?? "One size")} />
              ) : (
                <div className="empty-search"><span className="eyebrow">Nothing here just yet</span><h2>Try another search</h2><p>{searchQuery ? <>We couldn&apos;t find a piece matching &quot;{searchQuery}&quot;.</> : "No pieces match these filters right now."}</p><button className="button button-dark" type="button" onClick={() => { setSearchQuery(""); setActiveCategory("All"); setMaxPrice(300); setSizeFilter(""); setNewOnly(false); setBestOnly(false); setSaleOnly(false); }}>View the whole collection</button></div>
              )}
            </div>
          </div>
        </section>
      )}

      {screen === "product" && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          relatedProducts={products.filter((product) => product.id !== selectedProduct.id).slice(0, 4)}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onAddToCart={addToCart}
          onSelectProduct={openProduct}
          onHome={() => navigate("home")}
          onShop={(audience) => { setActiveAudience(audience); setActiveCategory("All"); navigate("shop"); }}
        />
      )}

      {screen === "wishlist" && (
        <section className="flow-page wishlist-page">
          <div className="flow-heading"><span className="eyebrow">Saved for a little later</span><h1>Your wishlist <span>({favorites.length})</span></h1><p>A collection of pieces that caught your eye.</p></div>
          {favorites.length > 0 ? (
            <div className="wishlist-products">
              <ProductGrid products={products.filter((product) => favorites.includes(product.id))} favorites={favorites} onFavorite={toggleFavorite} onSelect={openProduct} />
            </div>
          ) : (
            <div className="empty-cart"><div className="empty-bag-icon"><Icon name="heart" size={27} /></div><h2>Keep a little space for something lovely.</h2><p>Tap the heart on any piece you love and itÃ¢â‚¬â„¢ll be waiting here.</p><button type="button" className="button button-dark" onClick={() => { setActiveCategory("All"); navigate("shop"); }}>Explore the collection <Icon name="arrow" size={16} /></button></div>
          )}
        </section>
      )}

      {screen === "cart" && (
        <section className="flow-page cart-page">
          <div className="flow-heading"><span className="eyebrow">Your considered choices</span><h1>Your bag <span>({cartCount} {cartCount === 1 ? "piece" : "pieces"})</span></h1><p>Beautiful things, on their way to you.</p></div>
          {cart.length === 0 ? (
            <div className="empty-cart"><div className="empty-bag-icon"><Icon name="bag" size={30} /></div><h2>Your bag is taking a little breather.</h2><p>ThereÃ¢â‚¬â„¢s nothing here just yet. LetÃ¢â‚¬â„¢s find something youÃ¢â‚¬â„¢ll love.</p><button type="button" className="button button-dark" onClick={() => { setActiveCategory("All"); navigate("shop"); }}>Explore the collection <Icon name="arrow" size={16} /></button></div>
          ) : (
            <div className="cart-layout">
              <div className="cart-lines">
                {cart.map((item) => {
                  const product = products.find((entry) => entry.id === item.productId);
                  if (!product) return null;
                  return <article className="cart-line" key={`${item.productId}-${item.size}`}><button type="button" className="cart-line-image" onClick={() => openProduct(product)}><ProductImage src={product.image} alt={product.name} className="cart-photo" /></button><div className="cart-line-info"><button type="button" className="cart-line-name" onClick={() => openProduct(product)}>{product.name}</button><span>Color: {product.color} <span aria-hidden="true">·</span> Size: {item.size}</span><div className="quantity-control"><button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(product.id, item.size, -1)}><Icon name="minus" size={13} /></button><span>{item.quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(product.id, item.size, 1)}><Icon name="plus" size={13} /></button></div></div><div className="cart-line-price"><strong>{formatPrice(product.price * item.quantity)}</strong><button type="button" onClick={() => updateQuantity(product.id, item.size, -item.quantity)}>Remove</button></div></article>;
                })}
                <button type="button" className="continue-shopping" onClick={() => { setActiveCategory("All"); navigate("shop"); }}><span aria-hidden="true">←</span> Continue shopping</button>
              </div>
              <aside className="order-summary"><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><div className="summary-row"><span>Shipping</span><strong>{subtotal >= 150 ? "Complimentary" : "$12.00"}</strong></div><div className="summary-row"><span>Taxes</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal + (subtotal >= 150 || subtotal === 0 ? 0 : 12))}</strong></div>{subtotal < 150 && <div className="shipping-note"><span className="shipping-progress" style={{ width: `${Math.min((subtotal / 150) * 100, 100)}%` }} /><p>You&apos;re {formatPrice(Math.max(150 - subtotal, 0))} away from complimentary shipping</p></div>}<button type="button" className="button button-dark checkout-button" onClick={() => navigate("checkout")}>Continue to checkout <Icon name="arrow" size={16} /></button><div className="secure-note"><Icon name="shield" size={15} /> A little peace of mind: secure checkout</div></aside>
            </div>
          )}
          {cartNotice && <div className="admin-form-error" role="status">{cartNotice}</div>}
        </section>
      )}

      {screen === "checkout" && (
        orderPlaced ? (
          <section className="flow-page checkout-page">
            <div className="order-receipt">
              <div className="order-success"><div className="success-check"><Icon name="check" size={30} /></div><span className="eyebrow">A lovely choice</span><h2>Your order is confirmed.</h2><p>Your order has been saved and is being prepared.</p></div>
              <div className="receipt-paper" id="order-receipt"><div className="receipt-heading"><div><span className="eyebrow">Umber Collection</span><h3>Order receipt</h3></div><strong>{orderPlaced.orderNumber}</strong></div><div className="receipt-meta"><span>Placed {new Date(orderPlaced.createdAt).toLocaleString()}</span><span>{orderPlaced.email}</span></div><div className="receipt-address"><strong>Deliver to</strong><span>{orderPlaced.recipientName}</span><span>{orderPlaced.addressLine1}, {orderPlaced.city}, {orderPlaced.region} {orderPlaced.postalCode}, {orderPlaced.country}</span></div><div className="receipt-items">{orderPlaced.items.map((item) => <div className="receipt-item" key={item.id}><span>{item.quantity} Ãƒâ€” {item.productName}<small>Size {item.size}</small></span><strong>${Number(item.lineTotal).toFixed(2)}</strong></div>)}</div><div className="receipt-totals"><div><span>Subtotal</span><strong>${Number(orderPlaced.subtotal).toFixed(2)}</strong></div><div><span>Shipping</span><strong>{Number(orderPlaced.shipping) ? `$${Number(orderPlaced.shipping).toFixed(2)}` : "Complimentary"}</strong></div><div className="receipt-total"><span>Total</span><strong>${Number(orderPlaced.total).toFixed(2)}</strong></div></div><div className="receipt-payment"><span>Payment</span><strong>{orderPlaced.paymentMethod === "CARD" ? "Card Ã‚Â· Paid" : "Cash on delivery Ã‚Â· Unpaid"}</strong></div></div><div className="receipt-actions"><button type="button" className="button button-dark" onClick={() => window.print()}>Print receipt</button><button type="button" className="button button-outline-dark" onClick={() => { const paper = document.getElementById("order-receipt"); if (!paper) return; const blob = new Blob([paper.outerHTML], { type: "text/html" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `receipt-${orderPlaced.orderNumber}.html`; link.click(); URL.revokeObjectURL(url); }}>Download receipt</button><button type="button" className="button button-outline-dark" onClick={() => navigate("home")}>Back to the boutique <Icon name="arrow" size={16} /></button></div>
            </div>
          </section>
        ) : (
          <CheckoutPanel
            items={cart}
            products={products}
            onComplete={(order) => {
              setOrderPlaced(order);
              setCart([]);
            }}
          />
        )
      )}

      <StoreFooter />
    </main>
  );
}




