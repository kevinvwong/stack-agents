---
module: twilio
category: communication
description: Twilio SMS + voice — event reminders, volunteer notifications, two-factor auth via SMS
install: manual (vercel env add)
---

# Module: twilio

Twilio for SMS and programmatic voice calls. Used in event management (arscca-VMS volunteer notifications, event reminders) and anywhere SMS outreach is more reliable than email.

## Install

```bash
vercel env add TWILIO_ACCOUNT_SID production preview development
vercel env add TWILIO_AUTH_TOKEN production preview development
vercel env add TWILIO_PHONE_NUMBER production preview development
vercel env pull .env.local --yes
```

## Packages

```bash
npm install twilio
```

## Scaffold

**lib/sms/client.ts:**
```ts
import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);
```

**lib/sms/send.ts:**
```ts
import { twilioClient } from "./client";

export async function sendSMS(to: string, body: string) {
  return twilioClient.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });
}
```

## .env.example additions

```bash
# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```
