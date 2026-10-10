<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project guidance

- Read `CLAUDE.md` before making project changes. It contains the detailed architecture, design, content, SEO, database, and deployment notes; keep it as the main reference instead of copying the full guide here. `CLAUDE.md` imports this file with `@AGENTS.md`.
- This is a personal site built with Next.js 16.2.9 App Router, React 19, TypeScript, and Bun. Follow the installed Next.js docs under `node_modules/next/dist/docs/` for the exact version in this repository, especially for route files, layouts, metadata, and APIs.
- Route groups under `app/` own distinct navigation layouts. Check their layouts and the grid conventions in `components/main/styles.module.css` before changing page structure.
- Styling uses CSS Modules. Preserve the site's existing retro visual system and shared `Window` and `PageHeader` components where they fit.
- Use Bun for project commands. `CLAUDE.md` lists the supported dev, build, typecheck, and lint commands and explains why the default lint script should not be used as-is.
- There is no test framework configured. Do not add one for routine changes; use the relevant existing build, typecheck, or lint command when verification is requested or useful.
- Treat `ds-bundle/`, `.ds-sync/`, and `.next/` as generated output. Do not edit them as source files.
