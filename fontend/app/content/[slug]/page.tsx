import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/app/components/brand/BrandLogo";
import { ApiError, apiRequest } from "@/app/lib/api";

type PublishedPage = { title: string; content: string };

async function PublishedContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page: PublishedPage;
  try {
    page = await apiRequest<PublishedPage>(`/cms/pages/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <article className="content-page-article">
      <span className="eyebrow">Umber Collection</span>
      <h1>{page.title}</h1>
      <div className="content-page-body">{page.content}</div>
    </article>
  );
}

export default function PublishedPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="content-page">
      <header className="content-page-header">
        <Link href="/" aria-label="Umber Collection home">
          <BrandLogo className="brand-logo-image" />
        </Link>
        <Link href="/">Back to the collection</Link>
      </header>
      <Suspense fallback={<div className="content-page-loading" role="status">Loading page…</div>}>
        <PublishedContent params={params} />
      </Suspense>
    </main>
  );
}
