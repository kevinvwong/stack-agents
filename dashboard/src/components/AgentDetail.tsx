import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { type AgentMeta, CHAINS, FAMILY_COLORS } from "../data/agents";
import { theme } from "../theme";

interface Props {
  agent: AgentMeta;
  onClose: () => void;
  onSelectAgent?: (id: string) => void;
}

// File stem → chain id (mirrors STEM_TO_CHAIN_ID in data/agents.ts).
const STEM_TO_CHAIN_ID: Record<string, string> = {
  "web-data": "data",
  "web-security": "security",
  "web-ai-llm": "ai-llm",
  "web-application": "application",
  "web-infrastructure": "infrastructure",
  "web-observability": "observability",
  "web-presentation": "presentation",
  "game-narrative": "narrative",
  "game-level-design": "level-design",
  "game-production": "production",
};

// Reverse: chain id → file stem
const CHAIN_ID_TO_STEM: Record<string, string> = Object.fromEntries(
  Object.entries(STEM_TO_CHAIN_ID).map(([stem, id]) => [id, stem]),
);

function chainIdOf(stem: string): string {
  return STEM_TO_CHAIN_ID[stem] ?? stem;
}

function stemOf(chainId: string): string {
  return CHAIN_ID_TO_STEM[chainId] ?? chainId;
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

function parseHandoffTargets(body: string): string[] {
  const match = body.match(/##\s+Handoffs\s*\n([\s\S]*?)(?:\n##\s|\n---|\n*$)/);
  if (!match) return [];
  const targets: string[] = [];
  const seen = new Set<string>();
  for (const line of match[1].split("\n")) {
    const m = line.match(/\[AGENT:\s*([^\]]+)\]/);
    if (m) {
      const id = m[1].trim();
      if (!seen.has(id)) {
        seen.add(id);
        targets.push(id);
      }
    }
  }
  return targets;
}

interface ChainPosition {
  family: string;
  index: number;
  total: number;
  prev: string | null;
  next: string | null;
}

function findChainPosition(agentId: string): ChainPosition | null {
  const chainId = chainIdOf(agentId);
  for (const { family, chain } of CHAINS) {
    const idx = chain.indexOf(chainId);
    if (idx !== -1) {
      return {
        family,
        index: idx,
        total: chain.length,
        prev: idx > 0 ? chain[idx - 1] : null,
        next: idx < chain.length - 1 ? chain[idx + 1] : null,
      };
    }
  }
  return null;
}

export function AgentDetail({ agent, onClose, onSelectAgent }: Props) {
  const color = FAMILY_COLORS[agent.family];
  const [copied, setCopied] = useState(false);

  const routingId = chainIdOf(agent.id);
  const routingChip = `[AGENT: ${routingId}]`;
  const body = useMemo(() => stripFrontmatter(agent.raw), [agent.raw]);
  const handoffTargets = useMemo(() => parseHandoffTargets(body), [body]);
  const chainPos = useMemo(() => findChainPosition(agent.id), [agent.id]);

  // ESC closes the panel (#108)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCopyRoutingId = async () => {
    try {
      await navigator.clipboard.writeText(routingChip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be unavailable (insecure context); silently ignore.
    }
  };

  const handleNavigate = (chainId: string) => {
    if (!onSelectAgent) return;
    onSelectAgent(stemOf(chainId));
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.surface.base,
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${theme.spacing["4"]} ${theme.spacing["6"]}`,
          borderBottom: `1px solid ${theme.border.subtle}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
          gap: theme.spacing["3"],
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {agent.family}
          </div>
          <div
            style={{
              fontSize: theme.type.mdHeading,
              fontWeight: 700,
              color: theme.text.primary,
              marginTop: theme.spacing["1"],
            }}
          >
            {agent.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing["2"],
              marginTop: theme.spacing["2"],
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handleCopyRoutingId}
              title="Copy routing ID"
              aria-label={`Copy routing ID ${routingChip}`}
              style={{
                background: theme.surface.surface,
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.sm,
                padding: `2px ${theme.spacing["2"]}`,
                color: "#7dd3fc",
                fontFamily: "'Fira Code', monospace",
                fontSize: 11,
                cursor: "pointer",
                lineHeight: 1.6,
              }}
            >
              {copied ? "copied!" : routingChip}
            </button>
          </div>
          {agent.description && (
            <div
              style={{
                fontSize: 12,
                color: theme.text.secondary,
                marginTop: theme.spacing["2"],
                lineHeight: 1.5,
              }}
            >
              {agent.description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close agent detail"
          style={{
            background: "none",
            border: "none",
            color: theme.text.muted,
            cursor: "pointer",
            fontSize: 20,
            lineHeight: 1,
            padding: `0 ${theme.spacing["1"]}`,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: `${theme.spacing["4"]} ${theme.spacing["6"]}`,
        }}
      >
        {/* Chain position */}
        {chainPos && (
          <section
            aria-label="Chain position"
            style={{ marginBottom: theme.spacing["4"] }}
          >
            <div
              style={{
                display: "inline-block",
                background: theme.surface.surface,
                border: `1px solid ${theme.border.default}`,
                borderRadius: theme.radius.sm,
                padding: `2px ${theme.spacing["2"]}`,
                fontSize: 11,
                color: theme.text.secondary,
                fontWeight: 600,
                marginBottom: theme.spacing["2"],
              }}
            >
              Step {chainPos.index + 1} of {chainPos.total} in {chainPos.family}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing["2"],
                fontSize: 12,
                color: theme.text.secondary,
                flexWrap: "wrap",
              }}
            >
              {chainPos.prev ? (
                <button
                  type="button"
                  onClick={() => handleNavigate(chainPos.prev!)}
                  disabled={!onSelectAgent}
                  style={{
                    background: "none",
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    color: theme.text.primary,
                    padding: `2px ${theme.spacing["2"]}`,
                    fontSize: 12,
                    cursor: onSelectAgent ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  ← {chainPos.prev}
                </button>
              ) : (
                <span style={{ color: theme.text.muted }}>← start</span>
              )}
              {chainPos.next ? (
                <button
                  type="button"
                  onClick={() => handleNavigate(chainPos.next!)}
                  disabled={!onSelectAgent}
                  style={{
                    background: "none",
                    border: `1px solid ${theme.border.default}`,
                    borderRadius: theme.radius.sm,
                    color: theme.text.primary,
                    padding: `2px ${theme.spacing["2"]}`,
                    fontSize: 12,
                    cursor: onSelectAgent ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  {chainPos.next} →
                </button>
              ) : (
                <span style={{ color: theme.text.muted }}>end →</span>
              )}
            </div>
          </section>
        )}

        {/* Handoffs */}
        {handoffTargets.length > 0 && (
          <section
            aria-label="Handoffs"
            style={{ marginBottom: theme.spacing["4"] }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: theme.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: theme.spacing["2"],
              }}
            >
              Handoffs
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing["1"],
              }}
            >
              {handoffTargets.map((target) => (
                <li key={target}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(target)}
                    disabled={!onSelectAgent}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f59e0b",
                      cursor: onSelectAgent ? "pointer" : "default",
                      padding: 0,
                      fontSize: 12,
                      fontFamily: "'Fira Code', monospace",
                      textAlign: "left",
                    }}
                  >
                    → HANDOFF TO [{target}]
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <hr
          style={{
            border: "none",
            borderTop: `1px solid ${theme.border.subtle}`,
            margin: `${theme.spacing["4"]} 0`,
          }}
        />

        <div className="agent-markdown">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
