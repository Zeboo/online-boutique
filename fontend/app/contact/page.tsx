"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/app/lib/api";
import { Icon } from "@/app/components/ui/Icon";
import { StoreFooter } from "@/app/components/storefront/StoreFooter";
import { StoreHeader } from "@/app/components/storefront/StoreHeader";

type CmsBanner = {
  eyebrow: string;
  heading: string;
  body: string;
  imageUrl: string;
  href: string;
};

export default function ContactPage() {
  const [status, setStatus] = useState("");
  const [contactBanner, setContactBanner] = useState<CmsBanner | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    apiRequest<CmsBanner[]>("/cms/banners")
      .then((banners) => {
        if (active) setContactBanner(banners.find((banner) => banner.href === "/contact") ?? null);
      })
      .catch((error: unknown) => {
        console.error("Could not load Contact page banner.", error);
      });
    return () => {
      active = false;
    };
  }, []);

  function submitContactMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const topic = String(values.get("topic") ?? "General enquiry");
    const message = String(values.get("message") ?? "").trim();
    const subject = encodeURIComponent(`${topic} - ${name}`);
    const body = encodeURIComponent(`From: ${name} (${email})\nTopic: ${topic}\n\n${message}`);
    setStatus("Your email app is opening with your message ready to send.");
    window.location.href = `mailto:hello@fashionhub.com?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <StoreHeader
        activePage="contact"
        onHome={() => router.push("/")}
        onShop={() => router.push("/?view=shop")}
        onAudience={(audience) => router.push(`/?view=shop&audience=${audience}`)}
        onNewArrivals={() => router.push("/?view=new-arrivals")}
        onWishlist={() => router.push("/?view=wishlist")}
        onCart={() => router.push("/?view=cart")}
        onSearch={(query) => router.push(`/?view=search&q=${encodeURIComponent(query)}`)}
        searchOnSubmit
      />
      <main className="contact-route">
        <section className="contact-page" aria-labelledby="contact-title">
        <div
          className="contact-hero"
          style={contactBanner ? {
            backgroundImage: `linear-gradient(180deg, rgba(12, 10, 9, .34) 0%, rgba(12, 10, 9, .20) 48%, rgba(12, 10, 9, .34) 100%), url("${contactBanner.imageUrl}")`,
          } : undefined}
        >
          {contactBanner && <div className="cms-banner-overlay" aria-hidden="true" />}
          <span className="eyebrow">{contactBanner?.eyebrow ?? "We are here to help"}</span>
          <h1 id="contact-title">{contactBanner?.heading ?? "Let's talk style."}</h1>
          <p>{contactBanner?.body ?? "Questions about an order, a piece, or finding the right fit? Send us a note and our team will be happy to help."}</p>
          <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Contact</span></div>
        </div>
        <div className="contact-layout">
          <aside className="contact-details">
            <span className="eyebrow">The personal touch</span>
            <h2>We&apos;d love to hear from you.</h2>
            <p>Our customer care team is here for the little details that make shopping feel easy.</p>
            <a className="contact-method" href="mailto:hello@fashionhub.com"><span className="contact-icon"><Icon name="mail" size={19} /></span><span><small>Email us</small><strong>hello@fashionhub.com</strong><em>We usually reply within one business day.</em></span></a>
            <a className="contact-method" href="tel:+15550142024"><span className="contact-icon"><Icon name="support" size={19} /></span><span><small>Call our team</small><strong>+1 (555) 014-2024</strong><em>Monday to Friday, 9amâ€“5pm</em></span></a>
            <div className="contact-response"><Icon name="shield" size={18} /><span><strong>Here for every step</strong><small>From choosing your size to tracking your delivery, we&apos;re happy to help.</small></span></div>
          </aside>
          <form className="contact-form" onSubmit={submitContactMessage}>
            <div className="contact-form-heading"><span className="eyebrow">Get in touch</span><h2>Send us a message</h2><p>Fill in the form and your email app will open with your message ready.</p></div>
            <div className="contact-form-fields">
              <label>Your name<input name="name" type="text" autoComplete="name" placeholder="e.g. Alex Morgan" minLength={2} maxLength={80} required /></label>
              <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></label>
              <label className="contact-topic">What can we help with?<select name="topic" defaultValue="Order support"><option>Order support</option><option>Product or sizing question</option><option>Returns and exchanges</option><option>Something else</option></select></label>
              <label className="contact-message">Your message<textarea name="message" placeholder="Tell us how we can help..." minLength={10} maxLength={2000} rows={6} required /></label>
            </div>
            <button type="submit" className="button button-dark contact-submit">Prepare email <Icon name="arrow" size={16} /></button>
            <p className="contact-privacy">Your details are only used to respond to your enquiry.</p>
            {status && <p className="contact-status" role="status">{status}</p>}
          </form>
        </div>
        </section>
      </main>
      <StoreFooter />
    </>
  );
}
