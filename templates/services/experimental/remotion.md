---
module: remotion
category: experimental
description: "[EXPERIMENTAL] Remotion programmatic video rendering — generate MP4s from React components. Relevant to GTLI content pipeline for auto-generating lesson video thumbnails and short-form video assets."
install: npm
---

# Module: remotion (EXPERIMENTAL)

Remotion renders React components to MP4. Relevant to GTLI's content pipeline for generating thumbnail cards, animated lesson intros, and short social video clips without a video editor.

**Experimental status:** Remotion has a complex build environment (requires Chromium + ffmpeg), making Vercel deployment non-trivial. Most production uses run Remotion rendering in a separate Docker container or AWS Lambda. Not a drop-in Vercel deployment.

## Use cases in your projects

- GTLI: Auto-generate lesson preview videos from content JSON
- Auto-create thumbnail images from React components (cheaper than Remotion full video)
- Social media clips with animated data (if serving GTLI progress reports)

## Deployment constraint

**Cannot run in Vercel Serverless Functions.** Options:
- `@remotion/lambda` — render on AWS Lambda (managed by Remotion team)
- Docker container on Fly.io or Railway for rendering jobs
- Pre-render at build time for static video assets

## Packages

```bash
# Only install what you need — avoid pulling the full CLI into Next.js
npm install remotion @remotion/renderer @remotion/player
# For Lambda rendering
npm install @remotion/lambda
```

## Scaffold

**remotion/Root.tsx:**
```tsx
import { Composition } from "remotion";
import { LessonCard } from "./LessonCard";

export const RemotionRoot = () => (
  <Composition
    id="LessonCard"
    component={LessonCard}
    durationInFrames={150}
    fps={30}
    width={1280}
    height={720}
    defaultProps={{ title: "Lesson Title", module: "Module 1" }}
  />
);
```

**remotion/LessonCard.tsx:**
```tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface Props {
  title: string;
  module: string;
}

export const LessonCard: React.FC<Props> = ({ title, module }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#1e1e2e", opacity, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ color: "#cdd6f4", fontSize: 48, fontWeight: 700 }}>{title}</div>
      <div style={{ color: "#a6e3a1", fontSize: 24, marginTop: 16 }}>{module}</div>
    </AbsoluteFill>
  );
};
```

## .env.example additions

```bash
# Remotion Lambda (if using AWS rendering)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
REMOTION_FUNCTION_NAME=remotion-render-...
```
