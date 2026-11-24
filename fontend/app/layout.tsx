import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Umber Collection — Timeless style, considered by nature",
  description:
    "Discover thoughtful pieces for Gents, Ladies and Kids, chosen to be worn and loved for years to come.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* App Router loads this shared font link in the root layout. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
