import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { loadCommands, type CommandPage } from "../data/commands";
import {
  COMMAND_GROUP_ORDER,
  groupForFolder,
  type CommandGroup,
} from "../data/commandGroups";
import { theme } from "../theme";

export function CommandsViewer() {
  const [commands, setCommands] = useState<CommandPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCommands()
      .then((pages) => {
        setCommands(pages);
        setSelectedId((current) => current ?? pages[0]?.id ?? null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Group commands by agent family (matching the Agents tab taxonomy) rather
  // than by raw folder name. The Agents tab and Commands tab now share one
  // mental model: "Web Stack", "GitHub", "Workspace", etc. — not "web", "gh",
  // "notion". See data/commandGroups.ts for the folder → family mapping.
  // (Issue #113.)
  //
  // Search (#112) filters by name + description, case-insensitive, and hides
  // entirely-empty groups.
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (c: CommandPage) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    };
    const map = new Map<CommandGroup, CommandPage[]>();
    for (const c of commands) {
      if (!matches(c)) continue;
      const group = groupForFolder(c.group);
      const list = map.get(group) ?? [];
      list.push(c);
      map.set(group, list);
    }
    // Order groups by COMMAND_GROUP_ORDER (families first matching Agents tab,
    // then Panels / GTLI / Security / Docs / Other). Within each group, sort
    // commands alphabetically by title.
    return COMMAND_GROUP_ORDER.filter((g) => {
      const pages = map.get(g);
      return pages && pages.length > 0;
    }).map((g) => {
      const pages = (map.get(g) ?? [])
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title));
      return [g, pages] as const;
    });
  }, [commands, search]);

  const selected = commands.find((c) => c.id === selectedId) ?? null;

  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>
      <div
        style={{
          flex: "0 0 280px",
          overflow: "auto",
          borderRight: "1px solid #1e293b",
          padding: "16px 0",
        }}
      >
        <div style={{ padding: `0 20px ${theme.spacing["3"]}` }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands…"
            aria-label="Search commands by name or description"
            style={{
              width: "100%",
              background: theme.surface.surface,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
              color: theme.text.primary,
              padding: `4px ${theme.spacing["2"]}`,
              fontSize: 12,
              fontFamily: "inherit",
            }}
          />
        </div>
        {loading && commands.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 13, padding: "0 20px" }}>
            Loading…
          </div>
        )}
        {!loading && grouped.length === 0 && search && (
          <div
            style={{
              color: theme.text.muted,
              fontSize: 12,
              padding: "0 20px",
            }}
          >
            No commands match “{search}”
          </div>
        )}
        {grouped.map(([group, pages]) => (
          <div key={group} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#475569",
                padding: "0 20px 6px",
              }}
            >
              {group}
            </div>
            {pages.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: active ? "#1e293b" : "none",
                    border: "none",
                    borderLeft: active
                      ? "2px solid #6366f1"
                      : "2px solid transparent",
                    color: active ? "#f1f5f9" : "#94a3b8",
                    padding: "6px 20px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div
        style={{ flex: 1, overflow: "auto", padding: "20px 28px" }}
        className="agent-markdown"
      >
        {selected ? (
          <>
            <div
              style={{
                fontSize: 11,
                color: "#475569",
                marginBottom: 4,
                fontFamily: "monospace",
              }}
            >
              {selected.path}
            </div>
            {selected.description && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                {selected.description}
              </div>
            )}
            <ReactMarkdown>{selected.content}</ReactMarkdown>
          </>
        ) : (
          <div style={{ color: "#64748b" }}>
            {loading ? "Loading…" : "No command selected"}
          </div>
        )}
      </div>
    </div>
  );
}
