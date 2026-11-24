"use client";

import { useState } from "react";
import Image from "next/image";

type Props = { src?: string | null; alt: string; className: string; width: number; height: number };

function OrderProductImageContent({ src, alt, className, width, height }: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={`${className} order-product-image-fallback`} role="img" aria-label={`${alt || "Product"} image unavailable`}>Image unavailable</span>;
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} unoptimized onError={() => setFailed(true)} />;
}

export function OrderProductImage(props: Props) {
  const src = typeof props.src === "string" ? props.src.trim() : "";
  return <OrderProductImageContent key={src || "missing"} {...props} src={src} />;
}
