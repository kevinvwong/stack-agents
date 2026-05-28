export const theme = {
  surface: { base: "#0f172a", surface: "#1e293b", overlay: "#334155" },
  border: { subtle: "#1e293b", default: "#334155" },
  text: { primary: "#e2e8f0", secondary: "#94a3b8", muted: "#64748b" },
  focus: { color: "#6366f1", offset: "2px", width: "2px" },
  spacing: {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
  },
  radius: { sm: "4px", md: "8px" },
  type: {
    body: "13px",
    smHeading: "15px",
    mdHeading: "18px",
    lgHeading: "22px",
  },
} as const;
