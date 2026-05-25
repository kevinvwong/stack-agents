---
module: cloudinary
category: media
description: Cloudinary image and video CDN — upload, transform, and serve media with automatic optimization
install: manual (vercel env add)
---

# Module: cloudinary

Cloudinary for media management. Used in arscca-VMS for event photos and volunteer headshots. Handles upload, transformation (crop, resize, format conversion), and CDN delivery — replaces DIY S3 + image processing.

## Install

```bash
vercel env add CLOUDINARY_CLOUD_NAME production preview development
vercel env add CLOUDINARY_API_KEY production preview development
vercel env add CLOUDINARY_API_SECRET production preview development
vercel env pull .env.local --yes
```

## Packages

```bash
npm install cloudinary
```

## Scaffold

**lib/media/cloudinary.ts:**
```ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export { cloudinary };

export async function uploadImage(
  file: string | Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === "string" ? file : `data:image/jpeg;base64,${file.toString("base64")}`,
    { folder, resource_type: "auto" }
  );
  return { url: result.secure_url, publicId: result.public_id };
}
```

## .env.example additions

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
