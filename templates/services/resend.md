---
module: resend
category: communication
description: Resend transactional email — React Email templates, domain verification, and Vercel env wiring
install: manual (vercel env add)
---

# Module: resend

Resend for transactional email — welcome emails, event confirmations, password resets, cohort digests. Uses React Email for template authoring so emails are typed components, not HTML strings.

## Why this module

- React Email means email templates are `.tsx` files with component composition
- Resend has first-class Vercel integration (domain verification, DKIM wiring)
- Works from Vercel Edge Functions — no SMTP, no connection pools
- Used across arscca-VMS (event confirmations), GTLI (cohort digests), ernest (profile delivery)

## Install

```bash
vercel env add RESEND_API_KEY production preview development
vercel env add EMAIL_FROM production preview development
# value: Your Name <noreply@yourdomain.com>
vercel env pull .env.local --yes
```

## Packages

```bash
npm install resend @react-email/components
```

## Scaffold

**lib/email/client.ts:**
```ts
import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY!);
```

**lib/email/send.ts:**
```ts
import { resend } from "./client";
import type { ReactElement } from "react";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    react,
  });
}
```

**emails/welcome.tsx (starter template):**
```tsx
import { Html, Head, Body, Container, Text, Button } from "@react-email/components";

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Welcome, {name}!</Text>
          <Button href={process.env.NEXT_PUBLIC_APP_URL!}>Get started</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

## .env.example additions

```bash
# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=Your App <noreply@yourdomain.com>
```
