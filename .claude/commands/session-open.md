Session open briefing. Runs the startup script and renders the session briefing box on demand.

Run this command and report the results:

```bash
bash .claude/hooks/session-start.sh
```

Display the output exactly as rendered — do not reformat or summarize it. Then in one sentence, state what the most pressing thing to address is based on what the briefing showed (SYNC warnings, P0s, CI failure, or memory context). If everything is clean, say so and ask what to work on.
