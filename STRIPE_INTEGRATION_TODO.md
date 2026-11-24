# Stripe Checkout Integration

## Current integration

The store creates a hosted, one-time Stripe Checkout Session in `backend/src/payments/payments.service.ts`. Order products, quantities, currency, shipping, totals, and customer email come from the saved order on the server. The browser receives the hosted Checkout URL and redirects the customer there.

### Checkout parameters configured

| Parameter | Value / source |
| --- | --- |
| `mode` | `payment` (one-time order) |
| `ui_mode` | `hosted_page` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `allow_promotion_codes` | `false` |
| `submit_type` | `auto` |
| `integration_identifier` | `hosted_web_0001` |
| `origin_context` | `web` |
| `line_items` | Built from the order's database-backed items and shipping; prices are not client supplied. |
| `success_url` | Storefront origin plus the success query and URL-encoded order number. |
| `cancel_url` | Storefront origin plus `/?payment=cancelled`. |
| `customer_email` and receipt email | Saved order email. |
| `metadata` | Order ID and order number, required by the webhook to match and verify the completed payment. |

`payment_method_collection` is not set because this is a one-time `payment` session, not a subscription session. `mode`, URLs, `line_items`, customer email, receipt email, and order metadata are runtime values rather than sample placeholders. The application-specific email and metadata fields remain in place to support receipts and verified order fulfillment.

## Values to replace

There are no sample-only Checkout Session placeholders to replace in the implementation. Configure deployment-specific environment values in `backend/.env` (or the hosting provider's secret manager):

- `STRIPE_SECRET_KEY`: a secret key for the intended Stripe account and mode (`sk_test_...` for testing, `sk_live_...` for live payments).
- `STRIPE_WEBHOOK_SECRET`: the signing secret for the webhook endpoint configured below.
- `STOREFRONT_ORIGIN`: the public storefront origin used for Checkout redirects.
- The backend's public API origin must be reachable by Stripe for webhook delivery.

Never put Stripe secret keys in frontend code, commit them, or paste them into chat. A test secret key was shared in an earlier conversation; rotate/revoke it in Stripe and update the backend environment before relying on it.

## Setup and verification

1. Set the environment values above on the API server and restart it. Use matching test or live keys and webhook secrets from the same Stripe mode.
2. Configure a Stripe webhook at `<API_ORIGIN>/api/v1/payments/stripe/webhook` for `checkout.session.completed`, then set its signing secret as `STRIPE_WEBHOOK_SECRET`.
3. Use the storefront to sign in, place an order, and choose card payment. Confirm that the browser redirects to Stripe-hosted Checkout and that the amount and products match the server-created order.
4. In test mode, use Stripe's test card `4242 4242 4242 4242`, any future expiration date, and any three-digit CVC. Use the test address details requested by Checkout.
5. Complete payment and confirm Stripe delivers the webhook and the matching order changes from pending/unpaid to confirmed/paid. Also verify that cancelling Checkout returns to the store without marking the order paid.
6. Before going live, use live credentials and the live webhook signing secret, confirm the production storefront/API URLs, and complete Stripe's account activation requirements.

## Payment flow

The backend creates the order and Checkout Session from trusted database prices. Stripe redirects the customer to the hosted payment page. The webhook verifies the signature, order ID and number, Checkout Session ID, amount, currency, and paid status before marking the order paid and confirmed. The success redirect alone does not mark an order paid.

## Useful resources

- [Create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create)
- [Test payments](https://docs.stripe.com/testing)
- [Manage API keys](https://docs.stripe.com/keys)
- [Checkout fulfillment and webhooks](https://docs.stripe.com/checkout/fulfillment)
- [Stripe support](https://support.stripe.com/)
