"use client";

import { useState } from "react";
import { Icon } from "@/app/components/ui/Icon";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="newsletter">
      <div className="newsletter-copy">
        <Icon name="mail" className="newsletter-envelope" />
        <div>
          <h2>Subscribe to Our Newsletter</h2>
          <p>Get the latest fashion trends and exclusive offers.</p>
        </div>
      </div>
      {submitted ? (
        <div className="newsletter-success" role="status">Thanks! We’ll keep you posted.</div>
      ) : (
        <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); if (email.trim()) setSubmitted(true); }}>
          <input aria-label="Email address" type="email" required placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          <button type="submit">Subscribe</button>
        </form>
      )}
      <div className="newsletter-socials" aria-label="Follow us">
        <a href="#facebook" aria-label="Facebook"><Icon name="facebook" /></a>
        <a href="#instagram" aria-label="Instagram"><Icon name="instagram" /></a>
        <a href="#youtube" aria-label="YouTube"><Icon name="youtube" /></a>
        <a href="#pinterest" aria-label="Pinterest"><Icon name="pinterest" /></a>
        <a href="#tiktok" aria-label="TikTok"><Icon name="tiktok" /></a>
      </div>
      <span className="newsletter-privacy">Newsletter signup is a local demo until an email provider is configured.</span>
    </section>
  );
}
