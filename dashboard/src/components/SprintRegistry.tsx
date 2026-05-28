// dashboard/src/components/SprintRegistry.tsx
//
// Renders the stack-agents sprint registry (sprints/registry.json) inside
// the Projects tab. The registry is the canonical record of every sprint
// team ever assembled — making it visible in the dashboard surfaces the
// system's most powerful feature.

import { useMemo, useState } from "react";
import { loadSprints, type Sprint } from "../data/sprints";
import { theme } from "../theme";

interface SprintRegistryProps {
  // Optional: list of known project paths. When a sprint's projectPath
  // matches one of these, the project cell renders as an anchor link.
  knownProjectPaths?: ReadonlySet<string>;
}

// Slugify a project path for use as an in-page anchor target. Mirrors a
// stable identifier we can wire ProjectCard anchors to later without
// touching ProjectDashboard's existing flow.
function projectAnchor(path: string): string {
  return (
    "project-" +
    path
      .toLowerCase()
      .replace(/^\/+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  // Permissive ISO parse — registry entries may be `YYYY-MM-DD` or full ISO.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function StatusBadge({ status }: { status: Sprint["status"] }) {
  const active = status === "active";
  const color = active ? "#22c55e" : theme.text.muted;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}18`,
        border: `1px solid ${color}55`,
        borderRadius: theme.radius.sm,
        padding: "1px 7px",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {status}
    </span>
  );
}

function ResumeButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    const invocation = `/sprint:status ${name}`;
    try {
      await navigator.clipboard.writeText(invocation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable (insecure context). Fall back to a
      // no-op visual state — user can copy from the title attribute.
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      title={`Copy "/sprint:status ${name}" to clipboard`}
      style={{
        background: theme.surface.base,
        border: `1px solid ${theme.border.default}`,
        color: copied ? "#22c55e" : theme.text.secondary,
        borderRadius: theme.radius.sm,
        padding: "2px 8px",
        fontSize: 11,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `${theme.focus.width} solid ${theme.focus.color}`;
        e.currentTarget.style.outlineOffset = theme.focus.offset;
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = "none";
      }}
    >
      {copied ? "✓ copied" : "Resume"}
    </button>
  );
}

function ProjectCell({
  projectPath,
  known,
}: {
  projectPath: string;
  known: boolean;
}) {
  if (!projectPath) {
    return <span style={{ color: theme.text.muted }}>—</span>;
  }
  const label = projectPath.split("/").filter(Boolean).pop() ?? projectPath;
  if (known) {
    return (
      <a
        href={`#projects-${projectAnchor(projectPath)}`}
        title={projectPath}
        style={{
          color: theme.text.primary,
          textDecoration: "none",
          borderBottom: `1px dashed ${theme.border.default}`,
        }}
      >
        {label}
      </a>
    );
  }
  return (
    <span title={projectPath} style={{ color: theme.text.secondary }}>
      {label}
    </span>
  );
}

export function SprintRegistry({ knownProjectPaths }: SprintRegistryProps) {
  const sprints = useMemo(() => loadSprints(), []);

  if (sprints.length === 0) {
    return (
      <div
        style={{
          padding: theme.spacing["4"],
          border: `1px dashed ${theme.border.default}`,
          borderRadius: theme.radius.md,
          color: theme.text.muted,
          fontSize: theme.type.body,
          textAlign: "center",
        }}
      >
        No sprints registered. Run{" "}
        <code
          style={{
            background: theme.surface.base,
            padding: "1px 6px",
            borderRadius: theme.radius.sm,
            color: theme.text.secondary,
            fontFamily: "'Fira Code', monospace",
            fontSize: 12,
          }}
        >
          /sprint:assemble
        </code>{" "}
        in stack-agents to create one.
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Sprint registry"
      style={{
        border: `1px solid ${theme.border.default}`,
        borderRadius: theme.radius.md,
        overflow: "hidden",
        background: theme.surface.surface,
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: theme.type.body,
            color: theme.text.primary,
          }}
        >
          <thead>
            <tr
              style={{
                background: theme.surface.base,
                textAlign: "left",
                color: theme.text.secondary,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Sprint</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Goal</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Project</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
              <th
                style={{
                  padding: "8px 12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Last active
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                Agents
              </th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>{""}</th>
            </tr>
          </thead>
          <tbody>
            {sprints.map((sprint, i) => {
              const known =
                !!knownProjectPaths &&
                knownProjectPaths.has(sprint.projectPath);
              return (
                <tr
                  key={`${sprint.name}-${sprint.projectPath}-${i}`}
                  style={{
                    borderTop: `1px solid ${theme.border.subtle}`,
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      fontFamily: "'Fira Code', monospace",
                      fontWeight: 600,
                      color: theme.text.primary,
                    }}
                  >
                    {sprint.name}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: theme.text.secondary,
                      maxWidth: 320,
                    }}
                  >
                    {sprint.goal || (
                      <span style={{ color: theme.text.muted }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <ProjectCell
                      projectPath={sprint.projectPath}
                      known={known}
                    />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <StatusBadge status={sprint.status} />
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: theme.text.secondary,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(sprint.lastActiveAt)}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: theme.text.secondary,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                    title={
                      sprint.agents.length > 0
                        ? sprint.agents.join(", ")
                        : "No agents"
                    }
                  >
                    {sprint.agentCount}
                  </td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <ResumeButton name={sprint.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
