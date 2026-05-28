import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { groupDocs, loadDocs, type DocPage } from "../data/docs";
import { theme } from "../theme";

interface DocPageWithDescription extends DocPage {
  description?: string;
}

export function DocsViewer() {
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDocs()
      .then((pages) => {
        setDocs(pages);
        const firstInOrder = groupDocs(pages)[0]?.[1]?.[0]?.id;
        setSelectedId((current) => current ?? firstInOrder ?? null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter by title (and `description` if present), then re-group. Hides
  // entirely-empty groups. (Issue #112.)
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupDocs(docs);
    const filtered = docs.filter((d) => {
      const desc = (d as DocPageWithDescription).description ?? "";
      return (
        d.title.toLowerCase().includes(q) || desc.toLowerCase().includes(q)
      );
    });
    return groupDocs(filtered);
  }, [docs, search]);

  const selected = docs.find((d) => d.id === selectedId) ?? null;

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
            placeholder="Search docs…"
            aria-label="Search docs by title"
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
        {loading && docs.length === 0 && (
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
            No docs match “{search}”
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
                marginBottom: 8,
                fontFamily: "monospace",
              }}
            >
              {selected.path}
            </div>
            <ReactMarkdown>{selected.content}</ReactMarkdown>
          </>
        ) : (
          <div style={{ color: "#64748b" }}>
            {loading ? "Loading…" : "No document selected"}
          </div>
        )}
      </div>
    </div>
  );
}
