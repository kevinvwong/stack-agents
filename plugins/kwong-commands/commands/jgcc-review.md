---
description: Run the full JGCC reviewer suite against the codebase — 7 mandatory adult-tool agents in parallel, then 4 conditional agents, then synthesize a prioritized remediation plan.
---

Run the complete Joan Ganz Cooney Center review suite against this codebase. The product under review is an adult professional sales-pitch voice trainer (Next.js, Clerk auth, Neon/Drizzle, Deepgram STT, ElevenLabs TTS, Claude API).

## Step 1 — Run the 7 mandatory agents in parallel

Spawn all seven of these subagents simultaneously. Each reads the codebase independently and returns a structured report.

<agents>
- jgcc-learning-scientist
- jgcc-engagement-auditor
- jgcc-meaningfulness-transfer
- jgcc-equity-access
- jgcc-privacy-commercialism
- jgcc-student-usability
- jgcc-wellbeing-ritec8
</agents>

## Step 2 — Run the 4 conditional agents

After the mandatory agents complete, spawn the conditional agents. Each will self-gate and output N/A for child-specific criteria, applying only the adult analog.

<agents>
- jgcc-developmental-appropriateness
- jgcc-social-jme-reviewer
- jgcc-family-stakeholder
- jgcc-diversity-representation
</agents>

## Step 3 — Synthesize a prioritized remediation plan

After all 11 reports are returned, produce a single synthesis document with:

### Four Pillars Summary Score
| Pillar | Score (0–3) | Source agent |
|--------|-------------|--------------|
| P1 Active Learning | | jgcc-learning-scientist |
| P2 Engaged Learning | | jgcc-engagement-auditor |
| P3 Meaningful Learning | | jgcc-meaningfulness-transfer |
| P4 Socially Interactive | | jgcc-social-jme-reviewer |
| **Total /12** | | |

Flag if total ≤ 4 (lower-quality per Meyer et al. 2021).

### Hard Fails
List any hard-fail conditions from jgcc-privacy-commercialism or jgcc-wellbeing-ritec8 (Safety/DEI scores of 0). These must be remediated before any other work.

### Prioritized Remediation Backlog
Deduplicated, ranked by: (1) hard fails, (2) mandatory-agent findings scored 0–1, (3) cross-cutting issues appearing in 3+ reports, (4) conditional-agent findings.

Format each item as:
**[P0/P1/P2]** | **[Area]** | Finding | Recommended fix | Source agent(s)

### What's Working Well
Top 3 strengths identified across all 11 reports.

### Suggested Next Build Sprint
3–5 specific implementation tasks derived from the highest-priority findings, ordered by impact-to-effort ratio.
