<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Build

- `npx next build --webpack` — SWC binary corrupt on this Windows VM; must use `--webpack` to fall back to webpack
- `useSearchParams` comes from `next/navigation`, NOT from `@/i18n/navigation` (next-intl does not re-export it)

## Next.js version history

| Version | Status | Issue |
|---------|--------|-------|
| 16.2.6 | BAD | Standalone `output` + middleware rewrite bug (#94342) — all routes return 404 on Render |
| 16.2.5 | GOOD | Last stable version without the rewrite bug — **use this for Docker/standalone deploys** |
