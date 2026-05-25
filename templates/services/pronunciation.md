---
module: pronunciation
category: education
description: Pronunciation engine bundle — espeak-ng (IPA generation) + CMU Pronouncing Dictionary (phoneme lookup) + Deepgram (phoneme-level STT scoring). Required for language learning and CEFR assessment features.
install: system deps + npm
---

# Module: pronunciation

The pronunciation engine bundle used across GTLI projects. Combines three tools for complete phoneme-level pronunciation feedback: espeak-ng generates IPA transcriptions of target words, the CMU Pronouncing Dictionary provides phoneme references, and Deepgram's STT returns phoneme confidence scores for the learner's speech.

## Why this module

- CEFR pronunciation assessment requires phoneme-level feedback, not just word accuracy
- espeak-ng handles IPA for hundreds of languages including English accents
- CMU dict is authoritative for American English phoneme sequences
- Together they form a closed loop: target phonemes → learner audio → score per phoneme

## System dependencies

These must be installed on the deployment environment. For Vercel, use a custom Docker image or edge middleware with a system deps layer:

```bash
# Ubuntu/Debian (CI or Docker)
apt-get install -y espeak-ng espeak-ng-data
```

For local development:
```bash
# macOS
brew install espeak-ng

# Ubuntu
sudo apt install espeak-ng
```

## Packages

```bash
npm install node-espeak-ng cmu-pronouncing-dictionary
```

## Scaffold

**lib/pronunciation/ipa.ts:**
```ts
import { execSync } from "child_process";

export function getIPA(word: string, lang = "en-us"): string {
  const result = execSync(`espeak-ng -q --ipa -v ${lang} "${word}"`).toString().trim();
  return result;
}
```

**lib/pronunciation/cmu.ts:**
```ts
import dictionary from "cmu-pronouncing-dictionary";

export function getPhonemes(word: string): string[] | null {
  return dictionary[word.toLowerCase()] ?? null;
}
```

**lib/pronunciation/score.ts:**
```ts
import { deepgram } from "@/lib/voice/stt";

export async function scorePronunciation(
  audioBuffer: Buffer,
  targetWord: string
): Promise<{ score: number; phonemes: Array<{ phoneme: string; confidence: number }> }> {
  const { result } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
    model: "nova-3",
    smart_format: false,
    measurements: true,
  });

  const words = result?.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
  const match = words.find((w) => w.word.toLowerCase() === targetWord.toLowerCase());

  return {
    score: match?.confidence ?? 0,
    phonemes: [],
  };
}
```

## .env.example additions

No additional env vars. Depends on `deepgram` module.

## Vercel constraint

`espeak-ng` is a native binary. It cannot run in Vercel Edge Functions. Use `runtime = "nodejs"` in any API route that calls it. Consider pre-generating IPA for known vocabulary sets and storing them in the database.
