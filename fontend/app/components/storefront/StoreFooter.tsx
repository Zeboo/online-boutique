import Link from "next/link";
import { BrandLogo } from "@/app/components/brand/BrandLogo";
import { Icon } from "@/app/components/ui/Icon";

export function StoreFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-main">
        <div className="footer-brand-column">
          <Link href="/" className="brand footer-brand" aria-label="Style Ritual home"><BrandLogo className="brand-logo-image" /></Link>
          <p>Pieces to keep, wear, and love. A little more considered, a little more you.</p>
          <div className="footer-socials" aria-label="Follow Style Ritual">
            <a href="#facebook" aria-label="Facebook"><Icon name="facebook" /></a><a href="#instagram" aria-label="Instagram"><Icon name="instagram" /></a><a href="#youtube" aria-label="YouTube"><Icon name="youtube" /></a><a href="#pinterest" aria-label="Pinterest"><Icon name="pinterest" /></a><a href="#tiktok" aria-label="TikTok"><Icon name="tiktok" /></a>
          </div>
        </div>
        <div className="footer-column"><strong>Quick Links</strong><Link href="/?view=shop">Shop</Link><Link href="/">Home</Link><Link href="/?view=shop&audience=LADIES">Women</Link><Link href="/?view=shop&audience=GENTS">Men</Link></div>
        <div className="footer-column"><strong>Customer Service</strong><Link href="/account">My account</Link><Link href="/?view=cart">Shopping bag</Link><Link href="/contact?topic=returns">Returns policy</Link><Link href="/contact?topic=faq">FAQ</Link></div>
        <div className="footer-column"><strong>Contact Us</strong><Link href="/contact">Contact support</Link><Link href="/contact?topic=order">Track your order</Link><strong className="footer-payment-heading">We Accept</strong><span className="payment-methods" aria-label="Accepted payment methods"><span className="payment-brand payment-visa">VISA</span><span className="payment-brand payment-mastercard" aria-label="Mastercard"><i /><i /></span><span className="payment-brand payment-paypal"><b>Pay</b><strong>Pal</strong></span><span className="payment-brand payment-apple"><svg viewBox="0 0 20 22" aria-hidden="true"><path d="M15.9 11.6c0-2.1 1.7-3.1 1.8-3.2a4 4 0 0 0-3.1-1.7c-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.8-2.8-.8a4.2 4.2 0 0 0-3.5 2.1c-1.5 2.6-.4 6.5 1 8.6.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.7c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.1 1.1-2.2-.1 0-2-.8-2-3.7ZM13.8 5.3a3.8 3.8 0 0 0 .9-2.7 3.6 3.6 0 0 0-.9 2.6 3.3 3.3 0 0 0 2.6-1.2Z" /></svg><b>Pay</b></span></span></div>
      </div>
      <div className="footer-bottom"><span className="footer-copyright">&copy; 2026 Style Ritual. All rights reserved.</span><span className="footer-tagline">Thoughtful style, thoughtfully delivered.</span></div>
    </footer>
  );
}
