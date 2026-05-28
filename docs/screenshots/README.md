# Screenshots

Hero images referenced from the root `README.md` and other docs.

## Files

| File                        | Used by           | Notes                                                                                                              |
| --------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `dashboard-agent-graph.png` | `README.md` (top) | **Placeholder** — replace with a real capture of the Architecture / Agent Graph tab once the dashboard is running. |

## How to recapture `dashboard-agent-graph.png`

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:5173, select the Architecture / Agent Graph tab,
# expand the canvas to a 16:9 viewport, then screenshot the full graph.
```

Recommended resolution: 1920×1080 or larger. Keep the file under ~500 KB; run it through `pngquant` or `oxipng` if needed:

```bash
pngquant --quality 70-90 --output dashboard-agent-graph.png dashboard-agent-graph.png
```

Commit the replacement under the same filename so `README.md` keeps working without changes.
