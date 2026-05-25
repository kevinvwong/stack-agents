---
module: deepgram
category: ai
description: Deepgram STT — real-time speech-to-text via WebSocket for voice coaching and pronunciation assessment
install: manual (vercel env add)
---

# Module: deepgram

Deepgram speech-to-text for real-time transcription via WebSocket. Used in voice coaching (GTLI YLAI) and pronunciation assessment. Pairs with ElevenLabs TTS to form a complete voice pipeline.

## Why this module

- WebSocket streaming: transcription arrives word-by-word while user speaks
- Nova-3 model supports pronunciation confidence scores — needed for phoneme-level feedback
- Works in browser (WebSocket from client) or server (proxied WebSocket for API key protection)
- Lower latency than batch STT for conversational applications

## Install

```bash
vercel env add DEEPGRAM_API_KEY production preview development
vercel env pull .env.local --yes
```

## Packages

```bash
npm install @deepgram/sdk
```

## Scaffold

**lib/voice/stt.ts:**
```ts
import { createClient } from "@deepgram/sdk";

export const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const { result } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: "nova-3",
      smart_format: true,
      punctuate: true,
    }
  );
  return result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
}
```

**app/api/transcribe/route.ts:**
```ts
import { NextRequest } from "next/server";
import { transcribeAudio } from "@/lib/voice/stt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const buffer = Buffer.from(await req.arrayBuffer());
  const transcript = await transcribeAudio(buffer);
  return Response.json({ transcript });
}
```

## .env.example additions

```bash
# Deepgram
DEEPGRAM_API_KEY=...
```
