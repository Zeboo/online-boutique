export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: init.cache ?? (init.method && init.method !== "GET" ? "no-store" : "default"),
      credentials: "include",
      headers: {
        ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (init.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw error;
    }
    console.error(`The API request failed for ${path}.`, error);
    const detail = error instanceof Error ? ` (${error.message})` : "";
    throw new ApiError(
      `The Umber Collection API could not be reached${detail}. Start the API and PostgreSQL database, then try again.`,
      0,
    );
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    let body: unknown = null;
    try {
      body = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Next.js can return an HTML error page when its API rewrite cannot
      // contact the backend; never surface that page as an API message.
    }
    const messageValue =
      typeof body === "object" && body !== null && "message" in body
        ? body.message
        : undefined;
    const stripeDetails =
      typeof body === "object" && body !== null && "details" in body &&
      typeof body.details === "string"
        ? body.details
        : undefined;
    const stripeCode =
      typeof body === "object" && body !== null && "code" in body &&
      typeof body.code === "string"
        ? body.code
        : undefined;
    const message =
      typeof messageValue === "string"
        ? [messageValue, stripeCode, stripeDetails].filter(Boolean).join(" — ")
        : Array.isArray(messageValue) && messageValue.every((entry) => typeof entry === "string")
          ? messageValue.join(". ")
          : response.status >= 500
            ? "The API server failed while handling this request. Check that PostgreSQL is running, migrations are applied, and the API terminal has no startup or database errors."
            : `The request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type Audience = "GENTS" | "LADIES" | "KIDS";

export type CategoryRecord = {
  id: string;
  audience?: Audience;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string | null;
  price: string | number;
  compareAtPrice: string | number | null;
  currency: string;
  imageUrl: string;
  color: string | null;
  sizes: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  audience: Audience;
  categoryId: string;
  category: CategoryRecord;
};

export type DisplayProduct = {
  id: string;
  name: string;
  slug: string;
  category: "Gents" | "Ladies" | "Kids";
  audience?: Audience;
  categoryId: string;
  catalogCategory?: string;
  price: number;
  oldPrice?: number;
  image: string;
  color: string;
  badge?: string;
  description: string;
  sizes: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
};

export function toDisplayProduct(product: ProductRecord): DisplayProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.audience === "GENTS" ? "Gents" : product.audience === "LADIES" ? "Ladies" : "Kids",
    audience: product.audience,
    categoryId: product.categoryId,
    catalogCategory: product.category.name,
    price: Number(product.price),
    ...(product.compareAtPrice !== null
      ? { oldPrice: Number(product.compareAtPrice) }
      : {}),
    image: product.imageUrl,
    color: product.color ?? "Signature",
    ...(product.isFeatured ? { badge: "Featured" } : {}),
    description: product.description,
    sizes: product.sizes,
    stock: product.stock,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };
}
