"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/app/components/brand/BrandLogo";
import { Icon } from "@/app/components/ui/Icon";
import type { IconName } from "@/app/components/ui/Icon";
import {
  apiRequest,
  type CategoryRecord,
  type ProductRecord,
} from "@/app/lib/api";
import { ApiError } from "@/app/lib/api";

type AdminUser = { id: string; name: string; email: string; role: string };
type DashboardStats = {
  products?: number;
  activeProducts?: number;
  categories?: number;
  customers?: number;
  banners: number;
  pages: number;
  orders?: number;
  pendingOrders?: number;
};
type BannerRecord = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  imageUrl: string;
  href: string;
  isActive: boolean;
};
type BannerMedia = { imageUrl: string; mediaType: "image" | "video" };
type BannerPageTab = "home" | "shop" | "contact" | "content";
const bannerPageTabs: { id: BannerPageTab; label: string; href: string }[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "shop", label: "Shop", href: "/shop" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "content", label: "Content pages", href: "/content/" },
];
type PageRecord = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
};
type AdminOrder = {
  id: string;
  orderNumber: string;
  email: string;
  recipientName: string;
  status: string;
  statusNotificationSent?: boolean;
  paymentStatus: string;
  paymentMethod?: string;
  trackingCode?: string | null;
  shippingCarrier?: string | null;
  phone?: string;
  addressLine1?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  total: string | number;
  subtotal?: string | number;
  shipping?: string | number;
  currency: string;
  createdAt: string;
  items: { id: string; productName: string; imageUrl: string; sku?: string | null; quantity: number; size: string; unitPrice?: string | number; lineTotal?: string | number }[];
};
type AdminSection = "Overview" | "Products" | "Categories" | "Orders" | "Banners" | "Pages";

const sections: AdminSection[] = ["Overview", "Products", "Categories", "Orders", "Banners", "Pages"];
const orderTransitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
const managementRoles = ["ADMIN", "MANAGER", "CONTENT_MANAGER"];

async function fetchWorkspaceData(role: string) {
  const canManageCatalog = role === "ADMIN" || role === "MANAGER";
  const [dashboard, categoryList, productList, bannerList, pageList, orderList] = await Promise.all([
    apiRequest<DashboardStats>("/admin/dashboard"),
    canManageCatalog ? apiRequest<CategoryRecord[]>("/admin/catalog/categories") : Promise.resolve([]),
    canManageCatalog ? apiRequest<ProductRecord[]>("/admin/catalog/products?limit=100") : Promise.resolve([]),
    apiRequest<BannerRecord[]>("/admin/cms/banners"),
    apiRequest<PageRecord[]>("/admin/cms/pages"),
    canManageCatalog ? apiRequest<AdminOrder[]>("/admin/orders") : Promise.resolve([]),
  ]);
  return { dashboard, categoryList, productList, bannerList, pageList, orderList };
}

function readForm(event: FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(event.currentTarget).entries());
}

function valueOf(form: Record<string, FormDataEntryValue>, key: string) {
  const value = form[key];
  return typeof value === "string" ? value.trim() : "";
}

async function prepareGarmentImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return file;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const sample = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2]] as const;
  };
  const corners = [sample(0, 0), sample(width - 1, 0), sample(0, height - 1), sample(width - 1, height - 1)];
  const background = [0, 1, 2].map((index) => corners.reduce((total, color) => total + color[index], 0) / corners.length);
  const queue: number[] = [];
  const visited = new Uint8Array(width * height);
  const add = (x: number, y: number) => {
    const index = y * width + x;
    if (!visited[index]) { visited[index] = 1; queue.push(index); }
  };
  for (let x = 0; x < width; x += 1) { add(x, 0); add(x, height - 1); }
  for (let y = 1; y < height - 1; y += 1) { add(0, y); add(width - 1, y); }
  while (queue.length) {
    const index = queue.shift()!;
    const x = index % width;
    const y = Math.floor(index / width);
    const pixel = index * 4;
    const distance = Math.hypot(data[pixel] - background[0], data[pixel + 1] - background[1], data[pixel + 2] - background[2]);
    if (distance > 58) continue;
    data[pixel + 3] = distance < 30 ? 0 : Math.round(((distance - 30) / 28) * data[pixel + 3]);
    if (x > 0) add(x - 1, y);
    if (x < width - 1) add(x + 1, y);
    if (y > 0) add(x, y - 1);
    if (y < height - 1) add(x, y + 1);
  }
  context.putImageData(image, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.png`, { type: "image/png" }) : file;
}

function AdminStat({ label, value, note, icon }: { label: string; value: number; note: string; icon: IconName }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-top"><span>{label}</span><span className="admin-stat-icon"><Icon name={icon} size={19} /></span></div>
      <strong>{value.toLocaleString()}</strong>
      <small>{note}</small>
    </div>
  );
}

function AdminPageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="admin-page-heading">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>
      {action}
    </div>
  );
}

function AdminProductImage({ src, alt }: { src: string; alt: string }) {
  const imageSrc = typeof src === "string" ? src.trim() : "";
  return <AdminProductImageContent key={imageSrc || "missing"} src={imageSrc} alt={alt} />;
}

function AdminProductImageContent({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="admin-product-image-frame admin-product-image-missing" role="img" aria-label={alt ? `${alt} image unavailable` : "Product image unavailable"}><span aria-hidden="true">Image unavailable</span></span>;
  }
  return <span className="admin-product-image-frame"><Image src={src} alt={alt} fill sizes="96px" className="admin-product-thumb" unoptimized onError={() => setFailed(true)} /></span>;
}

export function AdminConsole({ initialSection = "Overview" }: { initialSection?: AdminSection }) {
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [bannerPageTab, setBannerPageTab] = useState<BannerPageTab>("home");
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bannerMedia, setBannerMedia] = useState<BannerMedia | null>(null);
  const [bannerMediaPreview, setBannerMediaPreview] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [editProductImageUrl, setEditProductImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canManageCatalog = user?.role === "ADMIN" || user?.role === "MANAGER";

  async function loadAdminData() {
    const currentUser = await apiRequest<AdminUser>("/auth/me");
    if (!managementRoles.includes(currentUser.role)) {
      router.replace("/admin/login");
      return;
    }
    setUser(currentUser);

    const data = await fetchWorkspaceData(currentUser.role);
    setStats(data.dashboard);
    setCategories(data.categoryList);
    setProducts(data.productList);
    setBanners(data.bannerList);
    setPages(data.pageList);
    setOrders(data.orderList);
  }

  useEffect(() => {
    let active = true;
    apiRequest<AdminUser>("/auth/me")
      .then(async (currentUser) => {
        if (!active) return;
        if (!managementRoles.includes(currentUser.role)) {
          router.replace("/admin/login");
          return;
        }
        setUser(currentUser);
        const data = await fetchWorkspaceData(currentUser.role);
        if (!active) return;
        setStats(data.dashboard);
        setCategories(data.categoryList);
        setProducts(data.productList);
        setBanners(data.bannerList);
        setPages(data.pageList);
        setOrders(data.orderList);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (loadError instanceof ApiError && loadError.status === 401) {
          router.replace("/admin/login");
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Could not load the admin dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [router]);

  async function refresh() {
    try {
      await loadAdminData();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Could not refresh the dashboard.");
      throw refreshError;
    }
  }

  async function runAction(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      await refresh();
      const notificationMissed = typeof result === "object" && result !== null && "statusNotificationSent" in result && result.statusNotificationSent === false;
      setMessage(notificationMissed
        ? "Order updated, but the customer email could not be sent. Configure or check the API SMTP settings."
        : "Your changes have been saved.");
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The change could not be saved.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      router.replace("/admin/login");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Could not sign out.");
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = readForm(event);
    const sizes = valueOf(form, "sizes").split(",").map((size) => size.trim()).filter(Boolean);
    const saved = await runAction(() => apiRequest("/admin/catalog/products", {
      method: "POST",
      body: JSON.stringify({
        name: valueOf(form, "name"),
        slug: valueOf(form, "slug"),
        description: valueOf(form, "description"),
        sku: valueOf(form, "sku") || undefined,
        price: Number(valueOf(form, "price")),
        compareAtPrice: valueOf(form, "compareAtPrice") ? Number(valueOf(form, "compareAtPrice")) : undefined,
        imageUrl: valueOf(form, "imageUrl"),
        color: valueOf(form, "color") || undefined,
        sizes,
        stock: Number(valueOf(form, "stock") || 0),
        audience: valueOf(form, "audience"),
        categoryId: valueOf(form, "categoryId"),
        isActive: form.isActive === "on",
        isFeatured: form.isFeatured === "on",
      }),
    }));
    if (saved) { formElement.reset(); setProductImageUrl(""); }
  }

  async function uploadProductImage(file: File | undefined, target: "create" | "edit" = "create") {
    if (!file) return;
    setError("");
    setMessage("");
    setUploadingImage(true);
    try {
      const payload = new FormData();
      const garmentFile = await prepareGarmentImage(file);
      payload.append("image", garmentFile);
      const uploaded = await apiRequest<{ imageUrl: string }>("/admin/catalog/uploads/product-image", {
        method: "POST",
        body: payload,
      });
      if (target === "edit") setEditProductImageUrl(uploaded.imageUrl);
      else setProductImageUrl(uploaded.imageUrl);
      setMessage(target === "edit" ? "Replacement image uploaded. Save the product to apply it." : "Product image uploaded. Complete the form to create the product.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
  }

  function beginProductEdit(product: ProductRecord) {
    setEditingProduct(product);
    setEditProductImageUrl(product.imageUrl);
    setSection("Products");
    setError("");
    setMessage("");
    window.requestAnimationFrame(() => document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function cancelProductEdit() {
    setEditingProduct(null);
    setEditProductImageUrl("");
  }

  function openOrder(order: AdminOrder) {
    router.push(`/admin/orders/${encodeURIComponent(order.id)}`);
  }

  async function updateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;
    const form = readForm(event);
    const sizes = valueOf(form, "sizes").split(",").map((size) => size.trim()).filter(Boolean);
    const saved = await runAction(() => apiRequest(`/admin/catalog/products/${editingProduct.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: valueOf(form, "name"),
        slug: valueOf(form, "slug"),
        description: valueOf(form, "description"),
        sku: valueOf(form, "sku") || undefined,
        price: Number(valueOf(form, "price")),
        compareAtPrice: valueOf(form, "compareAtPrice") ? Number(valueOf(form, "compareAtPrice")) : undefined,
        imageUrl: editProductImageUrl,
        color: valueOf(form, "color") || undefined,
        sizes,
        stock: Number(valueOf(form, "stock") || 0),
        audience: valueOf(form, "audience"),
        categoryId: valueOf(form, "categoryId"),
        isActive: form.isActive === "on",
        isFeatured: form.isFeatured === "on",
      }),
    }));
    if (saved) cancelProductEdit();
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = readForm(event);
    const saved = await runAction(() => apiRequest("/admin/catalog/categories", {
      method: "POST",
      body: JSON.stringify({
        name: valueOf(form, "name"),
        slug: valueOf(form, "slug"),
        description: valueOf(form, "description") || undefined,
        imageUrl: valueOf(form, "imageUrl") || undefined,
        sortOrder: Number(valueOf(form, "sortOrder") || 0),
        isActive: form.isActive === "on",
      }),
    }));
    if (saved) formElement.reset();
  }

  async function uploadBannerMedia(file: File | undefined) {
    if (!file) return;
    setError("");
    setMessage("");
    setUploadingImage(true);
    try {
      const payload = new FormData();
      payload.append("media", file);
      const uploaded = await apiRequest<BannerMedia>("/admin/cms/uploads/banner-media", { method: "POST", body: payload });
      setBannerMedia(uploaded);
      setBannerMediaPreview(URL.createObjectURL(file));
      setMessage("Banner media uploaded. Complete the form to create the banner.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The banner media could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function createBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = readForm(event);
    const saved = await runAction(() => apiRequest("/admin/cms/banners", {
      method: "POST",
      body: JSON.stringify({
        eyebrow: valueOf(form, "eyebrow"),
        heading: valueOf(form, "heading"),
        body: valueOf(form, "body"),
        imageUrl: bannerMedia?.imageUrl ?? "",
        href: valueOf(form, "href") || "/",
        sortOrder: Number(valueOf(form, "sortOrder") || 0),
        isActive: form.isActive === "on",
      }),
    }));
    if (saved) {
      formElement.reset();
      setBannerMedia(null);
      if (bannerMediaPreview) URL.revokeObjectURL(bannerMediaPreview);
      setBannerMediaPreview("");
    }
  }

  async function createPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = readForm(event);
    const payload = {
      slug: valueOf(form, "slug"),
      title: valueOf(form, "title"),
      content: valueOf(form, "content"),
      metaTitle: valueOf(form, "metaTitle") || undefined,
      metaDescription: valueOf(form, "metaDescription") || undefined,
      isPublished: form.isPublished === "on",
    };
    if (selectedPageId) {
      const saved = await runAction(() => apiRequest(`/admin/cms/pages/${selectedPageId}`, { method: "PATCH", body: JSON.stringify(payload) }));
      if (saved) formElement.reset();
      return;
    }
    let createdPageId = "";
    const saved = await runAction(async () => {
      const created = await apiRequest<PageRecord>("/admin/cms/pages", { method: "POST", body: JSON.stringify(payload) });
      createdPageId = created.id;
      return created;
    });
    if (saved) { setSelectedPageId(createdPageId); formElement.reset(); }
  }

  if (loading) {
    return <main className="admin-loading"><BrandLogo className="brand-logo-image" /><p>Opening your store dashboard…</p></main>;
  }

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? null;

  return (
    <main className="admin-app">
      <aside className="admin-rail">
        <button type="button" className="admin-rail-logo" onClick={() => router.push("/")}>
          <BrandLogo className="brand-logo-image" />
        </button>
        <span className="admin-rail-label">STORE MANAGEMENT</span>
        <nav className="admin-section-nav" aria-label="Administration">
          {sections.filter((item) => user?.role !== "CONTENT_MANAGER" || ["Overview", "Banners", "Pages"].includes(item)).map((item) => (
            <button type="button" key={item} aria-current={section === item ? "page" : undefined} className={section === item ? "admin-nav-active" : ""} onClick={() => setSection(item)}>
              <span>{sections.indexOf(item) + 1}</span>{item}
            </button>
          ))}
        </nav>
        <div className="admin-rail-bottom">
          <div className="admin-user-chip"><span>{user?.name.slice(0, 1).toUpperCase() ?? "U"}</span><div><strong>{user?.name}</strong><small>{user?.role.replaceAll("_", " ")}</small></div></div>
          <button type="button" onClick={() => router.push("/")}>← View storefront</button>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-title"><span className="eyebrow">UMBER COLLECTION · ADMIN</span><strong>{section}</strong></div>
          <div className="admin-topbar-actions">
            <span className="admin-session-status"><i /> Secure session</span>
            <button type="button" className="admin-refresh-button" disabled={busy} onClick={() => void refresh().catch(() => undefined)}><Icon name="return" size={16} /><span>Refresh</span></button>
            <button type="button" className="admin-signout-button" onClick={() => void signOut()}>Sign out</button>
            <div className="admin-topbar-user"><span>{user?.name}</span><div>{user?.name.slice(0, 1).toUpperCase()}</div></div>
          </div>
        </header>
        <div className="admin-main">
          {error && <div className="admin-banner admin-banner-error" role="alert">{error}</div>}
          {message && <div className="admin-banner admin-banner-success" role="status">{message}</div>}

          {section === "Overview" && (
            <>
              <AdminPageHeader eyebrow="Your store at a glance" title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.`} />
              {stats && <div className="admin-stat-grid">
                {stats.products !== undefined && <AdminStat label="All products" value={stats.products} note={`${stats.activeProducts ?? 0} currently published`} icon="bag" />}
                {stats.categories !== undefined && <AdminStat label="Collections" value={stats.categories} note="Gents · Ladies · Kids" icon="filter" />}
                {stats.customers !== undefined && <AdminStat label="Customers" value={stats.customers} note="Active customer accounts" icon="user" />}
                {stats.orders !== undefined && <AdminStat label="Orders" value={stats.orders} note={`${stats.pendingOrders ?? 0} awaiting confirmation`} icon="truck" />}
                <AdminStat label="Content pieces" value={stats.banners + stats.pages} note={`${stats.banners} banners · ${stats.pages} pages`} icon="mail" />
              </div>}
              {stats && <div className="admin-analytics-grid" aria-label="Store analytics">
                <section className="admin-chart-card"><div className="admin-chart-heading"><div><span className="eyebrow">Store pulse</span><h2>Catalog health</h2></div><span className="admin-chart-badge">Live</span></div><div className="admin-bar-chart"><div className="admin-bar-group"><div className="admin-bar-track"><i style={{ height: `${Math.max(12, ((stats.activeProducts ?? 0) / Math.max(stats.products ?? 1, 1)) * 100)}%` }} /></div><span>Published</span></div><div className="admin-bar-group"><div className="admin-bar-track"><i className="admin-bar-muted" style={{ height: `${Math.max(12, (((stats.products ?? 0) - (stats.activeProducts ?? 0)) / Math.max(stats.products ?? 1, 1)) * 100)}%` }} /></div><span>Drafts</span></div><div className="admin-chart-total"><strong>{stats.products ?? 0}</strong><small>Total pieces</small></div></div></section>
                <section className="admin-chart-card"><div className="admin-chart-heading"><div><span className="eyebrow">Customer flow</span><h2>Order momentum</h2></div><Icon name="truck" size={19} /></div><div className="admin-sparkline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div><div className="admin-chart-foot"><strong>{stats.orders ?? 0}</strong><span>Total orders</span><em>{stats.pendingOrders ?? 0} pending</em></div></section>
                <section className="admin-chart-card"><div className="admin-chart-heading"><div><span className="eyebrow">Store mix</span><h2>Collections</h2></div><Icon name="filter" size={19} /></div><div className="admin-donut"><div><strong>{stats.categories ?? 0}</strong><span>active</span></div></div><div className="admin-chart-foot"><span>Collections ready to merchandise</span></div></section>
              </div>}
              <div className="admin-overview-grid">
                {canManageCatalog && <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Recently added</span><h2>Latest pieces</h2></div><button type="button" onClick={() => setSection("Products")}>View catalog <Icon name="arrow" size={15} /></button></div>{products.slice(0, 4).map((product) => <div className="admin-list-row" key={product.id}><div className="admin-list-image"><AdminProductImage src={product.imageUrl} alt={product.name} /></div><div><strong>{product.name}</strong><span>{product.category.name} · ${Number(product.price).toFixed(2)}</span></div><span className={product.isActive ? "admin-pill-active" : "admin-pill-muted"}>{product.isActive ? "Live" : "Draft"}</span></div>)}</section>}
                <section className="admin-panel admin-quick-actions"><span className="eyebrow">Make it yours</span><h2>Quick actions</h2>{canManageCatalog && <><button type="button" onClick={() => setSection("Products")}>Add a product <Icon name="arrow" size={15} /></button><button type="button" onClick={() => setSection("Categories")}>Manage collections <Icon name="arrow" size={15} /></button></>}<button type="button" onClick={() => setSection("Banners")}>Refresh a homepage banner <Icon name="arrow" size={15} /></button><button type="button" onClick={() => setSection("Pages")}>Edit a content page <Icon name="arrow" size={15} /></button></section>
              </div>
            </>
          )}

          {section === "Orders" && (
            <>
              <AdminPageHeader eyebrow="Customer purchases" title="Orders" />
              <section className="admin-panel admin-table-panel">
                <div className="admin-table-heading">
                  <div><span className="eyebrow">Recent activity</span><h2>All orders <small>{orders.length}</small></h2></div>
                </div>
                {orders.length ? (
                  <div className="admin-order-list">
                    {orders.map((order) => (
                      <article className="admin-order-card" key={order.id} onClick={() => openOrder(order)}>
                        <div className="admin-order-card-heading">
                          <div><strong>{order.orderNumber}</strong><span>{new Date(order.createdAt).toLocaleString()}</span></div>
                          <span className={`admin-pill-${order.status === "CANCELLED" ? "muted" : order.status === "DELIVERED" ? "active" : "pending"}`}>{order.status.replaceAll("_", " ")}</span>
                        </div>
                        <div className="admin-order-card-details">
                          <span>{order.recipientName} · {order.email}</span>
                          <span className="admin-order-preview-items">{order.items.map((item) => <span className="admin-order-preview-item" key={item.id}><span className="admin-order-preview-image"><AdminProductImage src={item.imageUrl} alt="" /></span><span>{item.quantity} × {item.productName} ({item.size})</span></span>)}</span>
                          <strong>${Number(order.total).toFixed(2)} {order.currency} · {order.paymentMethod?.replaceAll("_", " ") ?? "Payment"} · {order.paymentStatus.replaceAll("_", " ")}</strong>
                          {order.trackingCode && <span className="admin-order-list-tracking">{order.shippingCarrier ?? "Courier"} tracking · {order.trackingCode}</span>}
                        </div>
                        <button type="button" className="admin-order-open-button" onClick={(event) => { event.stopPropagation(); openOrder(order); }}>View full order details <span aria-hidden="true">→</span></button>
                        {(orderTransitions[order.status] ?? []).some((status) => !(status === "CANCELLED" && order.paymentStatus === "PAID")) && (
                          <label className="admin-order-status-control" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                            Update status
                            <select
                              value=""
                              disabled={busy}
                              onChange={(event) => {
                                const status = event.target.value;
                                if (status) {
                                  void runAction(async () => {
                                    const saved = await apiRequest<AdminOrder>(`/admin/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
                                    setOrders((current) => current.map((entry) => entry.id === saved.id ? { ...entry, ...saved } : entry));
                                    return saved;
                                  });
                                }
                              }}
                            >
                              <option value="" disabled>Choose next status</option>
                              {(orderTransitions[order.status] ?? []).filter((status) => !(status === "CANCELLED" && order.paymentStatus === "PAID")).map((status) => <option key={status} value={status} disabled={status === "SHIPPED" && (!order.trackingCode || !order.shippingCarrier)}>{status.replaceAll("_", " ")}</option>)}
                            </select>
                            {orderTransitions[order.status]?.includes("SHIPPED") && (!order.trackingCode || !order.shippingCarrier) && <small>Save courier and tracking details from the order page before shipping.</small>}
                          </label>
                        )}
                        {order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus !== "PAID" && <button type="button" className="admin-payment-action" disabled={busy} onClick={(event) => { event.stopPropagation(); void runAction(async () => { const saved = await apiRequest<AdminOrder>(`/admin/orders/${order.id}/payment`, { method: "PATCH", body: JSON.stringify({ paymentStatus: "PAID" }) }); setOrders((current) => current.map((entry) => entry.id === saved.id ? { ...entry, ...saved } : entry)); return saved; }); }}>Mark COD paid</button>}
                      </article>
                    ))}
                  </div>
                ) : <p className="admin-empty">No orders have been placed yet.</p>}
              </section>
            </>
          )}

          {section === "Products" && (
            <>
              <AdminPageHeader eyebrow="Your catalog" title="Products" />
              <section id="product-editor" className={`admin-panel admin-form-panel admin-product-editor${editingProduct ? " is-editing" : ""}`}><div className="admin-edit-heading"><div><span className="eyebrow">{editingProduct ? "Edit the collection" : "Add to the collection"}</span><h2>{editingProduct ? `Edit ${editingProduct.name}` : "Create a product"}</h2><p className="admin-form-intro">{editingProduct ? "Update this product using the same form. Existing details are prefilled." : "Add a product with a clean image, merchandising details, and storefront visibility."}</p></div>{editingProduct && <button type="button" className="admin-secondary-button" onClick={cancelProductEdit}>Cancel editing</button>}</div><form key={editingProduct?.id ?? "new-product"} className="admin-form-grid admin-product-form" onSubmit={editingProduct ? updateProduct : createProduct}>
                <label>Name<input name="name" required maxLength={180} defaultValue={editingProduct?.name ?? ""} /></label>
                <label>URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={editingProduct?.slug ?? ""} /></label>
                <label>SKU<input name="sku" maxLength={80} defaultValue={editingProduct?.sku ?? ""} /></label>
                <label>Customer group<select name="audience" required defaultValue={editingProduct?.audience ?? ""}><option value="" disabled>Choose customer group</option><option value="GENTS">Gents</option><option value="LADIES">Ladies</option><option value="KIDS">Kids</option></select></label>
                <label>Category<select name="categoryId" required defaultValue={editingProduct?.categoryId ?? ""}><option value="" disabled>Choose Clothes, Shoes, or Bags</option>{categories.filter((category) => category.isActive || category.id === editingProduct?.categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Price (USD)<input name="price" type="number" step="0.01" min="0" required defaultValue={editingProduct ? Number(editingProduct.price) : ""} /></label>
                <label>Compare-at price<input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={editingProduct?.compareAtPrice == null ? "" : Number(editingProduct.compareAtPrice)} /></label>
                <label>Color<input name="color" maxLength={80} defaultValue={editingProduct?.color ?? ""} /></label>
                <label>Sizes, comma separated<input name="sizes" placeholder="XS, S, M, L" defaultValue={editingProduct?.sizes.join(", ") ?? ""} /></label>
                <label>Stock on hand<input name="stock" type="number" min="0" defaultValue={editingProduct?.stock ?? 0} /></label>
                <label className="admin-field-wide admin-image-upload-field">Product image
                  <input name="imageUrl" type="hidden" value={editingProduct ? editProductImageUrl : productImageUrl} required readOnly />
                  <span className="admin-image-upload-box">
                    <input type="file" accept="image/png,image/webp,image/jpeg" disabled={uploadingImage || busy} onChange={(event) => void uploadProductImage(event.target.files?.[0], editingProduct ? "edit" : "create")} />
                    <span className="admin-image-upload-button">{uploadingImage ? "Uploading…" : productImageUrl ? "Replace image" : "Upload image"}</span>
                    <small>PNG or WebP with a transparent background works best for the clothing rail. JPEG is also supported. Maximum 5 MB.</small>
                  </span>
                  {(editingProduct ? editProductImageUrl : productImageUrl) && <span className="admin-image-preview"><AdminProductImage src={editingProduct ? editProductImageUrl : productImageUrl} alt="Product preview" /><span>{editingProduct ? "Current image" : "Image ready"}</span></span>}
                </label>
                <label className="admin-field-wide">Description<textarea name="description" rows={3} required maxLength={10000} defaultValue={editingProduct?.description ?? ""} /></label>
                <label className="admin-check"><input type="checkbox" name="isActive" defaultChecked={editingProduct?.isActive ?? false} /><span><strong>{editingProduct ? "Published" : "Publish immediately"}</strong><small>Show this product in the storefront</small></span></label>
                <label className="admin-check"><input type="checkbox" name="isFeatured" defaultChecked={editingProduct?.isFeatured ?? false} /><span><strong>Feature on storefront</strong><small>Highlight this product in new arrivals</small></span></label>
                <div className="admin-form-actions admin-field-wide"><button className="button admin-product-submit" disabled={busy || uploadingImage || !(editingProduct ? editProductImageUrl : productImageUrl)}>{busy ? "Saving…" : uploadingImage ? "Uploading image…" : editingProduct ? "Save product changes" : "Create product"}<Icon name="arrow" size={16} /></button>{editingProduct && <button type="button" className="button admin-secondary-button" onClick={cancelProductEdit} disabled={busy}>Cancel</button>}</div>
              </form></section>
              {editingProduct && <section className="admin-panel admin-form-panel admin-edit-panel"><div className="admin-edit-heading"><div><span className="eyebrow">Editing product</span><h2>{editingProduct.name}</h2></div><button type="button" onClick={cancelProductEdit}>Cancel editing</button></div><form key={editingProduct.id} className="admin-form-grid" onSubmit={updateProduct}>
                <label>Name<input name="name" required maxLength={180} defaultValue={editingProduct.name} /></label>
                <label>URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={editingProduct.slug} /></label>
                <label>SKU<input name="sku" maxLength={80} defaultValue={editingProduct.sku ?? ""} /></label>
                <label>Customer group<select name="audience" required defaultValue={editingProduct.audience}><option value="GENTS">Gents</option><option value="LADIES">Ladies</option><option value="KIDS">Kids</option></select></label>
                <label>Category<select name="categoryId" required defaultValue={editingProduct.categoryId}><option value="" disabled>Choose category</option>{categories.filter((category) => category.isActive || category.id === editingProduct.categoryId).map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? "" : " (hidden)"}</option>)}</select></label>
                <label>Price (USD)<input name="price" type="number" step="0.01" min="0" required defaultValue={Number(editingProduct.price)} /></label>
                <label>Compare-at price<input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={editingProduct.compareAtPrice === null ? "" : Number(editingProduct.compareAtPrice)} /></label>
                <label>Color<input name="color" maxLength={80} defaultValue={editingProduct.color ?? ""} /></label>
                <label>Sizes, comma separated<input name="sizes" defaultValue={editingProduct.sizes.join(", ")} /></label>
                <label>Stock on hand<input name="stock" type="number" min="0" defaultValue={editingProduct.stock} /></label>
                <label className="admin-field-wide admin-image-upload-field">Product image
                  <input name="imageUrl" type="hidden" value={editProductImageUrl} required readOnly />
                  <span className="admin-image-upload-box">
                    <input type="file" accept="image/png,image/webp,image/jpeg" disabled={uploadingImage || busy} onChange={(event) => void uploadProductImage(event.target.files?.[0], "edit")} />
                    <span className="admin-image-upload-button">{uploadingImage ? "Uploading…" : "Replace image"}</span>
                    <small>Keep the current image or upload a new PNG, WebP, or JPEG up to 5 MB.</small>
                  </span>
                  {editProductImageUrl && <span className="admin-image-preview"><AdminProductImage src={editProductImageUrl} alt={`${editingProduct.name} preview`} /><span>Current image</span></span>}
                </label>
                <label className="admin-field-wide">Description<textarea name="description" rows={3} required maxLength={10000} defaultValue={editingProduct.description} /></label>
                <label className="admin-check"><input type="checkbox" name="isActive" defaultChecked={editingProduct.isActive} /> Published</label>
                <label className="admin-check"><input type="checkbox" name="isFeatured" defaultChecked={editingProduct.isFeatured} /> Featured on storefront</label>
                <div className="admin-form-actions admin-field-wide"><button type="button" className="button admin-secondary-button" onClick={cancelProductEdit} disabled={busy}>Cancel</button><button className="button button-dark" disabled={busy || uploadingImage || !editProductImageUrl}>{busy ? "Saving…" : "Save product changes"}</button></div>
              </form></section>}
              <section className="admin-panel admin-table-panel"><div className="admin-table-heading"><div><span className="eyebrow">Store inventory</span><h2>All products <small>{products.length}</small></h2></div></div>
                <div className="admin-product-table">{products.map((product) => <div className={`admin-product-row${editingProduct?.id === product.id ? " admin-product-row-editing" : ""}`} key={product.id}><div className="admin-list-image"><AdminProductImage src={product.imageUrl} alt={product.name} /></div><div className="admin-product-row-info"><strong>{product.name}</strong><span>{product.category.name} · {product.sku ?? "No SKU"} · Stock {product.stock}</span></div><strong>${Number(product.price).toFixed(2)}</strong><span className={product.isActive ? "admin-pill-active" : "admin-pill-muted"}>{product.isActive ? "Published" : "Draft"}</span><button type="button" disabled={busy} onClick={() => beginProductEdit(product)}>Edit</button><button type="button" disabled={busy} onClick={() => void runAction(() => apiRequest(`/admin/catalog/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !product.isActive }) }))}>{product.isActive ? "Unpublish" : "Publish"}</button><button type="button" disabled={busy} onClick={() => { if (window.confirm(`Archive “${product.name}”?`)) void runAction(() => apiRequest(`/admin/catalog/products/${product.id}`, { method: "DELETE" })); }}>Archive</button></div>)}</div>
              </section>
            </>
          )}

          {section === "Categories" && (
            <>
              <AdminPageHeader eyebrow="Organize your catalog" title="Clothes, Shoes & Bags" />
              <section className="admin-panel admin-form-panel admin-category-editor"><span className="eyebrow">Add a product category</span><h2>Create a category</h2><p className="admin-form-intro">Create Clothes, Shoes, Bags, or another category, then assign it from the product form.</p><form className="admin-form-grid admin-category-form" onSubmit={createCategory}>
                <label>Category name<input name="name" required maxLength={80} placeholder="e.g. Clothes, Shoes, or Bags" /></label>
                <label>URL slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
                <label>Sort order<input name="sortOrder" type="number" min="0" defaultValue="0" /></label>
                <label className="admin-field-wide">Image URL (HTTPS)<input name="imageUrl" type="url" pattern="https://.*" /></label>
                <label className="admin-field-wide">Description<textarea name="description" rows={2} maxLength={500} /></label>
                <label className="admin-check"><input type="checkbox" name="isActive" defaultChecked /><span><strong>Active on storefront</strong><small>Allow this category to appear in product selectors</small></span></label>
                <div className="admin-form-actions admin-field-wide"><button className="button admin-category-submit" disabled={busy}>{busy ? "Saving…" : "Create category"}<Icon name="arrow" size={16} /></button></div>
              </form></section>
              <div className="admin-category-grid">{categories.map((category) => <article className="admin-category-card" key={category.id}>{category.imageUrl && <div className="admin-category-image"><AdminProductImage src={category.imageUrl} alt={category.name} /></div>}<div><span className="eyebrow">Product category</span><h2>{category.name}</h2><p>{category.description}</p><small>{category._count?.products ?? 0} published products</small></div><button type="button" className={category.isActive ? "admin-pill-active" : "admin-pill-muted"} disabled={busy} onClick={() => void runAction(() => apiRequest(`/admin/catalog/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !category.isActive }) }))}>{category.isActive ? "Active" : "Hidden"} · Change</button></article>)}</div>
            </>
          )}

          {section === "Banners" && (
            <>
              <AdminPageHeader eyebrow="Storefront storytelling" title="Banners" />
              <nav className="admin-banner-tabs" aria-label="Choose a page's banners" role="tablist">
                {bannerPageTabs.map((tab) => <button key={tab.id} id={`banner-tab-${tab.id}`} type="button" role="tab" aria-selected={bannerPageTab === tab.id} aria-controls="banner-page-panel" className={bannerPageTab === tab.id ? "is-active" : ""} onClick={() => setBannerPageTab(tab.id)}>{tab.label}<span>{tab.id === "content" ? banners.filter((banner) => banner.href.startsWith(tab.href)).length : banners.filter((banner) => banner.href === tab.href).length}</span></button>)}
              </nav>
              <section id="banner-page-panel" role="tabpanel" aria-labelledby={`banner-tab-${bannerPageTab}`}>
                <section className="admin-panel admin-form-panel admin-banner-editor"><div className="admin-edit-heading"><div><span className="eyebrow">{bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.label} page</span><h2>Create a banner</h2><p className="admin-form-intro">Add a campaign image and message for this page. Set its order and publish it when it is ready.</p></div></div><form className="admin-banner-form" onSubmit={createBanner}>
                  <label className="admin-banner-field">Eyebrow<input name="eyebrow" required maxLength={100} placeholder="e.g. New season" /></label><label className="admin-banner-field">Headline<input name="heading" required maxLength={180} placeholder="A clear campaign headline" /></label>
                  <label className="admin-banner-field admin-banner-field-wide">Supporting copy<textarea name="body" rows={3} required maxLength={500} placeholder="A short message for your visitors" /></label>
                  <div className="admin-banner-field admin-banner-field-wide"><span className="admin-banner-label">Banner image or video</span><input name="imageUrl" type="hidden" value={bannerMedia?.imageUrl ?? ""} readOnly required /><div className="admin-banner-upload-box"><label className="admin-banner-upload-button"><input type="file" accept="image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm" disabled={uploadingImage || busy} onChange={(event) => void uploadBannerMedia(event.target.files?.[0])} />{uploadingImage ? "Uploading media…" : bannerMedia ? "Replace media" : "Choose image or video"}</label><span className="admin-banner-upload-help">PNG, JPEG, WebP, AVIF, MP4, or WebM · up to 50 MB</span>{bannerMedia && <span className="admin-banner-upload-name">{bannerMedia.mediaType === "video" ? "Video" : "Image"} uploaded</span>}</div>{bannerMediaPreview && <div className="admin-banner-media-preview">{bannerMedia?.mediaType === "video" ? <video src={bannerMediaPreview} controls muted playsInline /> : <Image src={bannerMediaPreview} alt="Banner preview" fill sizes="600px" unoptimized />}</div>}</div>
                  {bannerPageTab === "content" ? <label className="admin-banner-field">Content page destination<select name="href" required defaultValue="">{pages.map((page) => <option key={page.id} value={`/content/${page.slug}`}>{page.title} · /content/{page.slug}</option>)}</select></label> : <label className="admin-banner-field">Page destination<input name="href" value={bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.href ?? "/"} readOnly /></label>}
                  <label className="admin-banner-field">Display order<input name="sortOrder" type="number" defaultValue="0" min="0" max="10000" /></label>
                  <label className="admin-banner-publish"><input type="checkbox" name="isActive" defaultChecked /><span><strong>Publish banner</strong><small>Make this banner visible on the storefront</small></span></label>
                  <div className="admin-banner-actions"><button className="button admin-banner-submit" disabled={busy || uploadingImage || !bannerMedia || (bannerPageTab === "content" && pages.length === 0)}>{busy ? "Saving…" : "Create banner"}<Icon name="arrow" size={16} /></button>{bannerPageTab === "content" && pages.length === 0 && <small className="admin-banner-hint">Create a content page first to add a banner here.</small>}{!bannerMedia && <small className="admin-banner-hint">Upload an image or video to enable saving.</small>}</div>
                </form></section>
                <section className="admin-panel admin-table-panel"><div className="admin-table-heading"><div><span className="eyebrow">Campaigns for {bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.label}</span><h2>{bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.label} banners <small>{banners.filter((banner) => bannerPageTab === "content" ? banner.href.startsWith("/content/") : banner.href === bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.href).length}</small></h2></div></div>{banners.filter((banner) => bannerPageTab === "content" ? banner.href.startsWith("/content/") : banner.href === bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.href).length === 0 ? <p className="admin-banner-empty">No banners for this page yet. Create one above to get started.</p> : banners.filter((banner) => bannerPageTab === "content" ? banner.href.startsWith("/content/") : banner.href === bannerPageTabs.find((tab) => tab.id === bannerPageTab)?.href).map((banner) => <div className="admin-banner-row" key={banner.id}><div className="admin-banner-image">{/\.(mp4|webm)(?:$|\?)/i.test(banner.imageUrl) ? <video src={banner.imageUrl} muted playsInline /> : <Image src={banner.imageUrl} alt="" fill sizes="120px" unoptimized />}</div><div className="admin-banner-row-info"><strong>{banner.heading}</strong><span>{banner.eyebrow} · {banner.href}</span></div><span className={banner.isActive ? "admin-pill-active" : "admin-pill-muted"}>{banner.isActive ? "Published" : "Draft"}</span><button type="button" disabled={busy} onClick={() => void runAction(() => apiRequest(`/admin/cms/banners/${banner.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !banner.isActive }) }))}>{banner.isActive ? "Unpublish" : "Publish"}</button><button type="button" disabled={busy} onClick={() => { if (window.confirm(`Archive “${banner.heading}”?`)) void runAction(() => apiRequest(`/admin/cms/banners/${banner.id}`, { method: "DELETE" })); }}>Archive</button></div>)}</section>
              </section>
            </>
          )}

          {section === "Pages" && (
            <>
              <AdminPageHeader eyebrow="The words behind the wardrobe" title="Content pages" />
              <nav className="admin-cms-page-tabs" aria-label="Choose a content page" role="tablist">
                {pages.map((page) => <button key={page.id} id={`cms-page-tab-${page.id}`} type="button" role="tab" aria-selected={selectedPageId === page.id} aria-controls="cms-page-panel" className={selectedPageId === page.id ? "is-active" : ""} onClick={() => setSelectedPageId(page.id)}><span>{page.title}</span><small className={page.isPublished ? "is-published" : ""}>{page.isPublished ? "Published" : "Draft"}</small></button>)}
                <button id="cms-page-tab-new" type="button" role="tab" aria-selected={!selectedPageId} aria-controls="cms-page-panel" className={`admin-cms-new-tab${!selectedPageId ? " is-active" : ""}`} onClick={() => setSelectedPageId(null)}><Icon name="plus" size={15} /> New page</button>
              </nav>
              <section id="cms-page-panel" role="tabpanel" aria-labelledby={selectedPageId ? `cms-page-tab-${selectedPageId}` : "cms-page-tab-new"}>
                <section className="admin-panel admin-form-panel admin-cms-page-editor"><div className="admin-edit-heading"><div><span className="eyebrow">{selectedPage ? (selectedPage.isPublished ? "Published page" : "Unpublished draft") : "Create a content page"}</span><h2>{selectedPage ? `Edit ${selectedPage.title}` : "New page details"}</h2><p className="admin-form-intro">Manage the page title, address, content, search preview, and storefront visibility together.</p></div>{selectedPage && <div className="admin-cms-page-actions">{selectedPage.isPublished && <><a className="admin-cms-preview-link" href={`/content/${selectedPage.slug}`} target="_blank" rel="noreferrer">View live page <Icon name="arrow" size={14} /></a><button type="button" className="admin-secondary-button" disabled={busy} onClick={() => { if (window.confirm(`Unpublish “${selectedPage.title}”? It will remain available here as a draft.`)) void runAction(() => apiRequest(`/admin/cms/pages/${selectedPage.id}`, { method: "DELETE" })); }}>Unpublish</button></>}</div>}</div>
                  <form key={selectedPage?.id ?? "new-cms-page"} className="admin-cms-page-form" onSubmit={createPage}>
                    <label className="admin-cms-field">Page title<input name="title" required maxLength={180} defaultValue={selectedPage?.title ?? ""} placeholder="e.g. Our story" /></label>
                    <label className="admin-cms-field">URL slug<div className="admin-cms-slug-input"><span>/content/</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={150} defaultValue={selectedPage?.slug ?? ""} placeholder="our-story" /></div></label>
                    <label className="admin-cms-field admin-cms-field-wide">Page content<textarea name="content" rows={12} required maxLength={50000} defaultValue={selectedPage?.content ?? ""} placeholder="Write the content visitors will see on this page. Separate paragraphs with a blank line." /><small>Up to 50,000 characters. Blank lines are preserved on the published page.</small></label>
                    <div className="admin-cms-seo-block"><div><span className="eyebrow">Search appearance</span><p>Optional metadata used by search engines and social previews.</p></div><label className="admin-cms-field">Meta title<input name="metaTitle" maxLength={180} defaultValue={selectedPage?.metaTitle ?? ""} placeholder="Uses the page title if blank" /></label><label className="admin-cms-field">Meta description<textarea name="metaDescription" rows={3} maxLength={320} defaultValue={selectedPage?.metaDescription ?? ""} placeholder="A short summary for search results" /></label></div>
                    <div className="admin-cms-page-footer"><label className="admin-cms-publish"><input type="checkbox" name="isPublished" defaultChecked={selectedPage?.isPublished ?? false} /><span><strong>Publish page</strong><small>{selectedPage?.isPublished ? "Visible to visitors" : "Keep this page as a draft until it is ready"}</small></span></label><button className="button admin-cms-save" disabled={busy}>{busy ? "Saving…" : selectedPage ? "Save page changes" : "Create page"}<Icon name="arrow" size={16} /></button></div>
                  </form>
                </section>
                {pages.length === 0 && <section className="admin-panel admin-cms-empty"><span className="eyebrow">Start here</span><h2>No content pages yet</h2><p>Create your first page. It will be available at <strong>/content/your-page-slug</strong> after publishing.</p></section>}
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
