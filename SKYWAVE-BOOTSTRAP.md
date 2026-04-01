# SkyWave Bootstrap Snippet

Use this snippet at the top of any `AGENTS.md` where you want Codex to treat `$skywave` as the default control layer.

## Copy-Paste Block

```md
## SkyWave Control Layer

Use SkyWave as the orchestration layer for every medium or large task.

Mandatory bootstrap:

- Always load `$skywave` from `C:\Users\h REDA\.codex\skills\skywave\SKILL.md` as the default entrypoint for any medium or large task.
- Do not bypass SkyWave for non-trivial work unless the user explicitly asks for a different route on that task.
- Treat SkyWave as the first control layer, then let it choose the specialist skills needed for the current phase.
- For trivial one-file or read-only tasks, SkyWave may be skipped only if using it would add unnecessary ceremony.
```

## Placement

Place the block near the top of `AGENTS.md`, before detailed phase rules or specialist workflow sections.

## Notes

- `AGENTS.md` is the file Codex follows automatically inside a repository.
- If a nested project has its own `AGENTS.md`, add the same snippet there too.
- Keep the path exactly as written unless your local SkyWave installation moves.
