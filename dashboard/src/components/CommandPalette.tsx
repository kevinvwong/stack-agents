import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { loadAgents, type AgentMeta } from "../data/agents";
import { loadCommands, type CommandPage } from "../data/commands";
import { theme } from "../theme";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Copy text to the clipboard with a fallback for browsers that don't expose
// `navigator.clipboard.writeText` (older Safari, non-HTTPS contexts, some
// embedded webviews). The fallback creates a hidden textarea, selects it, and
// uses the deprecated-but-still-widely-supported `document.execCommand('copy')`.
function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    // Avoid scrolling to bottom and keep it visually hidden.
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.opacity = "0";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [agents, setAgents] = useState<AgentMeta[]>([]);
  const [commands, setCommands] = useState<CommandPage[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Lazy-load agents + commands on first open. Both data sources are already
  // exposed by existing modules (data/agents.ts, data/commands.ts).
  useEffect(() => {
    if (!open) return;
    if (agents.length === 0) {
      loadAgents()
        .then(setAgents)
        .catch(() => {});
    }
    if (commands.length === 0) {
      loadCommands()
        .then(setCommands)
        .catch(() => {});
    }
  }, [open, agents.length, commands.length]);

  // Show a "Copied!" toast for 1.5s after a successful copy.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const commandInvocations = useMemo(() => {
    // Map a CommandPage to its slash-invocation. Files live under
    // src/content/commands/<folder>/<name>.md (or a top-level *.md). The
    // invocation is `/<folder>:<name>` (or just `/<name>` at the root).
    return commands.map((c) => {
      const parts = c.path.replace(/\.md$/, "").split("/");
      const invocation =
        parts.length === 1
          ? `/${parts[0]}`
          : `/${parts[0]}:${parts.slice(1).join("/")}`;
      return { ...c, invocation };
    });
  }, [commands]);

  const handleSelectAgent = (a: AgentMeta) => {
    const text = `[AGENT: ${a.id}]`;
    copyToClipboard(text).then((ok) => {
      setToast(ok ? `Copied ${text}` : `Copy failed`);
      onOpenChange(false);
    });
  };

  const handleSelectCommand = (c: { invocation: string }) => {
    copyToClipboard(c.invocation).then((ok) => {
      setToast(ok ? `Copied ${c.invocation}` : `Copy failed`);
      onOpenChange(false);
    });
  };

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Command palette"
        overlayClassName="stack-cmdk-overlay"
        contentClassName="stack-cmdk-content"
      >
        {/* Inline styles for the dialog primitives — kept here so the
            CommandPalette stays self-contained per the issue's constraints
            (no new global CSS files). All colors come from theme.ts. */}
        <style>{`
          [cmdk-overlay].stack-cmdk-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
          }
          [cmdk-dialog].stack-cmdk-content,
          .stack-cmdk-content {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: min(560px, 90vw);
            background: ${theme.surface.overlay};
            border: 1px solid ${theme.border.default};
            border-radius: ${theme.radius.md};
            color: ${theme.text.primary};
            font-family: 'Inter', system-ui, sans-serif;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            z-index: 9999;
            overflow: hidden;
          }
          .stack-cmdk-content [cmdk-input] {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid ${theme.border.default};
            color: ${theme.text.primary};
            padding: ${theme.spacing["3"]} ${theme.spacing["4"]};
            font-size: 14px;
            font-family: inherit;
            outline: none;
            box-sizing: border-box;
          }
          .stack-cmdk-content [cmdk-input]::placeholder {
            color: ${theme.text.muted};
          }
          .stack-cmdk-content [cmdk-list] {
            max-height: 360px;
            overflow-y: auto;
            padding: ${theme.spacing["2"]} 0;
          }
          .stack-cmdk-content [cmdk-group-heading] {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${theme.text.muted};
            padding: ${theme.spacing["2"]} ${theme.spacing["4"]} ${theme.spacing["1"]};
          }
          .stack-cmdk-content [cmdk-item] {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
            cursor: pointer;
            color: ${theme.text.secondary};
            font-size: 13px;
            border-left: 2px solid transparent;
          }
          .stack-cmdk-content [cmdk-item][data-selected="true"] {
            background: ${theme.surface.surface};
            color: ${theme.text.primary};
            border-left-color: ${theme.focus.color};
          }
          .stack-cmdk-content [cmdk-empty] {
            padding: ${theme.spacing["4"]};
            color: ${theme.text.muted};
            font-size: 13px;
            text-align: center;
          }
          .stack-cmdk-content .stack-cmdk-item-meta {
            font-size: 11px;
            color: ${theme.text.muted};
            font-family: 'Fira Code', monospace;
          }
          .stack-cmdk-content .stack-cmdk-item-desc {
            font-size: 11px;
            color: ${theme.text.muted};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
        `}</style>
        <Command.Input placeholder="Search agents and commands…" autoFocus />
        <Command.List>
          <Command.Empty>No results.</Command.Empty>
          {agents.length > 0 && (
            <Command.Group heading="Agents">
              {agents.map((a) => (
                <Command.Item
                  key={`agent-${a.id}`}
                  value={`agent ${a.id} ${a.name} ${a.description}`}
                  onSelect={() => handleSelectAgent(a)}
                >
                  <div>
                    <span className="stack-cmdk-item-meta">
                      [AGENT: {a.id}]
                    </span>
                    {a.name && a.name !== a.id && (
                      <span style={{ marginLeft: 8 }}>{a.name}</span>
                    )}
                  </div>
                  {a.description && (
                    <div className="stack-cmdk-item-desc">{a.description}</div>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {commandInvocations.length > 0 && (
            <Command.Group heading="Commands">
              {commandInvocations.map((c) => (
                <Command.Item
                  key={`cmd-${c.id}`}
                  value={`command ${c.invocation} ${c.title} ${c.description}`}
                  onSelect={() => handleSelectCommand(c)}
                >
                  <div>
                    <span className="stack-cmdk-item-meta">{c.invocation}</span>
                    {c.title && (
                      <span style={{ marginLeft: 8 }}>{c.title}</span>
                    )}
                  </div>
                  {c.description && (
                    <div className="stack-cmdk-item-desc">{c.description}</div>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: theme.surface.overlay,
            border: `1px solid ${theme.border.default}`,
            borderRadius: theme.radius.sm,
            color: theme.text.primary,
            padding: `${theme.spacing["2"]} ${theme.spacing["4"]}`,
            fontSize: 12,
            fontFamily: "'Inter', system-ui, sans-serif",
            zIndex: 10000,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
