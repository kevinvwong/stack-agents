---
module: elevenlabs
category: ai
description: ElevenLabs TTS — streaming voice synthesis for AI coaching, narration, and language learning feedback
install: manual (vercel env add)
---

# Module: elevenlabs

ElevenLabs text-to-speech for streaming voice generation. Used in AI coaching products (YLAI), language learning feedback (GTLI), and anywhere you need high-quality spoken output beyond browser TTS.

## Why this module

- Voice quality is dramatically better than browser `speechSynthesis`
- Streaming delivery: audio starts playing before full generation completes
- Multiple voices per application: coaching persona, narrator, feedback voice
- Works alongside Deepgram STT for full voice pipelines

## Install

```bash
vercel env add ELEVENLABS_API_KEY production preview development
vercel env add ELEVENLABS_VOICE_ID production preview development
# default voice — override per use case
vercel env pull .env.local --yes
```

## Packages

```bash
npm install elevenlabs
```

## Scaffold

**lib/voice/tts.ts:**
```ts
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export async function synthesizeStream(text: string, voiceId?: string) {
  return client.textToSpeech.convertAsStream(
    voiceId ?? process.env.ELEVENLABS_VOICE_ID!,
    {
      text,
      model_id: "eleven_turbo_v2",
      output_format: "mp3_44100_128",
    }
  );
}
```

**app/api/tts/route.ts:**
```ts
import { NextRequest } from "next/server";
import { synthesizeStream } from "@/lib/voice/tts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json();
  const stream = await synthesizeStream(text, voiceId);
  return new Response(stream as unknown as ReadableStream, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
```

## .env.example additions

```bash
# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```
