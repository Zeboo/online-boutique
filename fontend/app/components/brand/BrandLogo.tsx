import Image from "next/image";

export function BrandLogo({ className = "" }: { className?: string }) {
  return <Image src="/logo.png" alt="Style Ritual" width={1536} height={1024} className={className || "brand-logo-image"} />;
}
