import { useState, useMemo, useEffect } from "react";
import { Map, FolderOpen, BookOpen, Terminal } from "lucide-react";
import { AgentGraph } from "./components/AgentGraph";
import { ArchitectureDiagram } from "./components/ArchitectureDiagram";
import { AgentDetail } from "./components/AgentDetail";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { DocsViewer } from "./components/DocsViewer";
import { CommandsViewer } from "./components/CommandsViewer";
import {
  loadAgents,
  buildEdges,
  FAMILY_COLORS,
  type AgentFamily,
  type AgentMeta,
  type Edge,
} from "./data/agents";
import { theme } from "./theme";

type Tab = "graph" | "projects" | "docs" | "commands";
type ViewMode = "architecture" | "dependency";

function useHashTab(): [Tab, (t: Tab) => void] {
  const hashToTab = (h: string): Tab => {
    const raw = h.replace("#", "");
    return (["graph", "projects", "docs", "commands"] as Tab[]).includes(
      raw as Tab,
    )
      ? (raw as Tab)
      : "graph";
  };
  const [tab, setTabState] = useState<Tab>(() =>
    hashToTab(window.location.hash),
  );

  useEffect(() => {
    const handler = () => setTabState(hashToTab(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const setTab = (t: Tab) => {
    window.location.hash = t === "graph" ? "" : t;
    setTabState(t);
  };

  return [tab, setTab];
}

// Issue #118: Lucide SVG icons for nav chrome — replaces the prior emoji
// vocabulary (🗺📁📖⌘) so the dashboard renders consistently across
// platforms (notably Windows, where emoji rendered as full-size color
// bitmaps clashing with the dark dev-tool aesthetic).
const TAB_ICONS: Record<Tab, typeof Map> = {
  graph: Map,
  projects: FolderOpen,
  docs: BookOpen,
  commands: Terminal,
};

const TAB_LABELS: Record<Tab, string> = {
  graph: "Agents",
  projects: "Projects",
  docs: "Docs",
  commands: "Commands",
};

const ALL_FAMILIES: AgentFamily[] = [
  "Web Stack",
  "Quality",
  "Research",
  "Product",
  "Cross-cutting",
  "Workspace",
  "Game Design",
  "GitHub",
  "Meta",
];

export default function App() {
  const [tab, setTab] = useHashTab();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [familyFilter, setFamilyFilter] = useState<AgentFamily | null>(null);
  const [allAgents, setAllAgents] = useState<AgentMeta[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("architecture");
  const [agentSearch, setAgentSearch] = useState("");

  useEffect(() => {
    loadAgents()
      .then((agents) => {
        setAllAgents(agents);
        setAllEdges(buildEdges(agents));
      })
      .finally(() => {
        setAgentsLoading(false);
      });
  }, []);

  // Family filter narrows the data within the active view. It never swaps
  // views — that is owned by `viewMode` (issue #103).
  const familyFilteredAgents = useMemo(
    () =>
      familyFilter
        ? allAgents.filter((a) => a.family === familyFilter)
        : allAgents,
    [allAgents, familyFilter],
  );
  const familyFilteredEdges = useMemo(
    () =>
      familyFilter
        ? allEdges.filter(
            (e) =>
              familyFilteredAgents.some((a) => a.id === e.source) &&
              familyFilteredAgents.some((a) => a.id === e.target),
          )
        : allEdges,
    [allEdges, familyFilteredAgents, familyFilter],
  );

  // Search match predicate — name + description, case-insensitive (issue #112).
  const searchQuery = agentSearch.trim().toLowerCase();
  const matchesSearch = (a: AgentMeta) => {
    if (!searchQuery) return true;
    return (
      a.name.toLowerCase().includes(searchQuery) ||
      a.id.toLowerCase().includes(searchQuery) ||
      a.description.toLowerCase().includes(searchQuery)
    );
  };

  // For the architecture view we can't dim individual nodes (ArchitectureDiagram
  // is out-of-scope this round per spec), so we hide non-matches by filtering
  // the input array. For dependency view, AgentGraph receives a set of matching
  // IDs and dims non-matches in-place.
  const architectureAgents = useMemo(
    () =>
      searchQuery
        ? familyFilteredAgents.filter(matchesSearch)
        : familyFilteredAgents,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [familyFilteredAgents, searchQuery],
  );

  const matchingIds = useMemo(() => {
    if (!searchQuery) return null;
    return new Set(familyFilteredAgents.filter(matchesSearch).map((a) => a.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyFilteredAgents, searchQuery]);

  // Look up selected agent from the *full* unfiltered list so that the detail
  // panel survives family-filter changes (issue #115, preferred option).
  const selected = allAgents.find((a) => a.id === selectedAgent) ?? null;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "0 20px",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
          height: 52,
        }}
      >
        <span
          style={{
            fontWeight: 800,
            fontSize: 15,
            color: "#f1f5f9",
            marginRight: 24,
          }}
        >
          stack-agents
        </span>
        <div role="tablist" style={{ display: "flex", alignItems: "center" }}>
          {(["graph", "projects", "docs", "commands"] as Tab[]).map((t) => {
            const isActive = tab === t;
            const Icon = TAB_ICONS[t];
            return (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${t}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setTab(t)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      theme.surface.surface;
                    (e.currentTarget as HTMLButtonElement).style.color =
                      theme.text.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      theme.text.muted;
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #6366f1"
                    : "2px solid transparent",
                  color: isActive ? "#f1f5f9" : "#64748b",
                  fontWeight: isActive ? 600 : 400,
                  padding: "0 16px",
                  height: 52,
                  cursor: "pointer",
                  fontSize: 13,
                  textTransform: "capitalize",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background-color 120ms ease, color 120ms ease",
                  fontFamily: "inherit",
                }}
              >
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                {TAB_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agents toolbar (graph tab only): view toggle + search + family filter */}
      {tab === "graph" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing["3"],
            padding: `${theme.spacing["2"]} 20px`,
            borderBottom: `1px solid ${theme.border.subtle}`,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          {/* View mode toggle (#103) */}
          <div
            role="group"
            aria-label="Graph view mode"
            style={{
              display: "inline-flex",
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
              overflow: "hidden",
            }}
          >
            {(
              [
                ["architecture", "Architecture"],
                ["dependency", "Dependency Chains"],
              ] as const
            ).map(([mode, label]) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setViewMode(mode)}
                  style={{
                    background: active ? theme.surface.surface : "transparent",
                    border: "none",
                    color: active ? theme.text.primary : theme.text.muted,
                    fontWeight: active ? 600 : 400,
                    fontSize: 11,
                    padding: `4px ${theme.spacing["3"]}`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search (#112) */}
          <input
            type="search"
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            placeholder="Search agents…"
            aria-label="Search agents by name or description"
            style={{
              background: theme.surface.surface,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
              color: theme.text.primary,
              padding: `4px ${theme.spacing["2"]}`,
              fontSize: 12,
              fontFamily: "inherit",
              minWidth: 200,
            }}
          />

          {/* Family filter pills (#119: All/Clear label, × glyph on active) */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setFamilyFilter(null)}
              style={{
                background: familyFilter === null ? "#1e293b" : "none",
                border: "1px solid #334155",
                borderRadius: 6,
                color: familyFilter === null ? "#f1f5f9" : "#64748b",
                padding: "4px 10px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {familyFilter === null ? "All" : "Clear"}
            </button>
            {ALL_FAMILIES.map((f) => {
              const active = familyFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFamilyFilter(active ? null : f)}
                  aria-pressed={active}
                  aria-label={
                    active
                      ? `${f} filter active, click to remove`
                      : `Filter by ${f}`
                  }
                  style={{
                    background: active ? `${FAMILY_COLORS[f]}33` : "none",
                    border: `1px solid ${active ? FAMILY_COLORS[f] : "#334155"}`,
                    borderRadius: 6,
                    color: active ? "#f1f5f9" : "#64748b",
                    padding: "4px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "inherit",
                  }}
                >
                  <span>{f}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 12,
                        lineHeight: 1,
                        opacity: 0.8,
                      }}
                    >
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {tab === "graph" && (
          <>
            <div
              style={{
                flex: selected ? "1 1 60%" : "1 1 100%",
                minWidth: 0,
                transition: "flex 0.2s",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {agentsLoading && allAgents.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  Loading agents…
                </div>
              ) : viewMode === "architecture" ? (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ArchitectureDiagram
                    agents={architectureAgents}
                    onSelect={setSelectedAgent}
                    onFilterFamily={setFamilyFilter}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 0 }}>
                  <AgentGraph
                    agents={familyFilteredAgents}
                    edges={familyFilteredEdges}
                    selectedAgent={selectedAgent}
                    onSelectAgent={setSelectedAgent}
                    dimmedIds={matchingIds}
                  />
                </div>
              )}
            </div>
            {selected && (
              <div style={{ flex: "0 0 420px", overflow: "hidden" }}>
                <AgentDetail
                  agent={selected}
                  onClose={() => setSelectedAgent(null)}
                  onSelectAgent={setSelectedAgent}
                />
              </div>
            )}
          </>
        )}
        {tab === "projects" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <ProjectDashboard />
          </div>
        )}
        {tab === "docs" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <DocsViewer />
          </div>
        )}
        {tab === "commands" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <CommandsViewer />
          </div>
        )}
      </div>

      {/* Legend (graph tab) */}
      {tab === "graph" && (
        <div
          style={{
            flexShrink: 0,
            padding: "8px 20px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            gap: 20,
            fontSize: 11,
            color: "#64748b",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 24,
                height: 2,
                background: "#94a3b8",
                display: "inline-block",
              }}
            />
            dependency chain
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 24,
                height: 2,
                background: "#f59e0b",
                display: "inline-block",
                borderTop: "2px dashed #f59e0b",
              }}
            />
            handoff
          </span>
          <span style={{ marginLeft: "auto" }}>
            {familyFilteredAgents.length} agents · {familyFilteredEdges.length}{" "}
            edges
          </span>
        </div>
      )}
    </div>
  );
}
