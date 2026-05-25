---
module: stripe
category: payments
description: Stripe payments — checkout sessions, webhook signature verification, subscription status in DB
install: manual (vercel env add)
---

# Module: stripe

Stripe for payments and subscriptions. Covers checkout session creation, webhook signature verification (the part most implementations get wrong), and syncing subscription status into the database.

## Why this module

- Webhook signature verification is mandatory — never trust unsigned Stripe events
- Checkout sessions via server-side redirect (not client-side Stripe.js) keeps keys off the client
- Subscription sync to DB required for access control — don't call Stripe on every request

## Install

```bash
vercel env add STRIPE_SECRET_KEY production preview development
vercel env add STRIPE_PUBLISHABLE_KEY production preview development
vercel env add STRIPE_WEBHOOK_SECRET production preview development
vercel env pull .env.local --yes
```

## Packages

```bash
npm install stripe @stripe/stripe-js
```

## Scaffold

**lib/stripe/client.ts:**
```ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});
```

**app/api/stripe/webhook/route.ts:**
```ts
import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/client";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // sync subscription to DB
      break;
    case "customer.subscription.deleted":
      // mark subscription inactive in DB
      break;
  }

  return new Response("ok");
}
```

## .env.example additions

```bash
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
