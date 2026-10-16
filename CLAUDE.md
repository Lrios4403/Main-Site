# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

This is a personal site, "M4cgyvers Repurposed Mining Rig", built with Next 16.2 (App Router), React 19.2, TypeScript and Bun. SEO regression checks use Bun's built-in test runner.

## Commands

```bash
bun install
bun dev                      # http://localhost:3000
bun run build
bun run test:seo             # unit and malformed HTML fixture checks
bun run check:seo            # bounded audit against localhost:3000
bunx tsc --noEmit            # typecheck
bunx eslint app components lib   # lint (see below for why not `bun run lint`)
```

- Use `bunx tsc`, not `npx tsc`. On Windows, Bun installs the `.bin` shim as `tsc.exe`/`tsc.bunx`, which npx doesn't find, so `npx tsc` prints "This is not the tsc command you are looking for".
- `bun run lint` runs a bare `eslint` over the whole directory. The flat config in `eslint.config.mjs` doesn't read `.gitignore`, so it also lints the generated `ds-bundle/` and `.ds-sync/` directories and reports over a thousand problems. Lint `app components lib` instead, or add those directories to `globalIgnores`.
- `next.config.ts` pins `turbopack.root` to this folder. Without it, Turbopack picks the parent folder (it has the legacy app's `package-lock.json`) as the workspace root and watches both apps and `current.zip`. That made `next dev` balloon in memory and serve stale builds.
- If a page renders without CSS in dev after a hot update, stop the server, delete `.next`, and start it again.

## Layout model

- `app/layout.tsx` renders the whole page chrome: a fixed background image, a grain overlay, a centered container whose height follows the content, and a CSS grid that holds page chrome and the footer. Pages render directly into that grid, and SiteLayout returns a fragment of grid children.
- The grid is defined in `components/main/styles.module.css` with the template areas `header`, `slideshow`, `navigation-lhs`, `content` and `footer`. When the grid contains the top navigation bar, a `:has()` rule adds a `topnav` row under the header. Pages place each child into an area by passing the matching class: `styles.header`, `styles.navLhs` or `styles.contentArea`. Below 768px the grid collapses to a single column.
- All routes now live in ordinary folders (`app/page.tsx`, `app/blogs`, `app/projects`, `app/contact`, `app/games`). There are no navigation route groups.
- `components/site-layout/SiteLayout.tsx` is a shared Server Component explicitly selected by each page:
  - `variant="home"`: slideshow, full sidebar (navigation, Views, Frens), then page content.
  - `variant="index"`: top navigation, sidebar with only Views and Frens, then page content.
  - `variant="detail"`: top navigation, page content with its own author/resources/TOC sidebar, then one tracking pixel.
- SiteLayout returns a fragment so existing CSS grid placement is preserved. It does not inspect the pathname or turn page content into client components. Sidebar's ViewCounter owns tracking on home/index; only details receive the standalone ViewPixel. Do not add a second tracker.
- `app/not-found.tsx` keeps its own untracked sidebar and does not use SiteLayout, so unknown routes do not count as visits.
- `components/window/Window.tsx` is the one shared UI primitive: a frosted-glass panel with an optional gradient title bar. Use `className` to set its grid area and `bodyStyle` to override its padding.
- Most pages build their header window with `components/page-header/PageHeader.tsx`, which adds the spinning pizza cube (`components/pizza-cube/`, plays `public/sounds/boom.mp3` on click). The blog post still writes its header `Window` by hand.
- The look and most of the text come from the 2023 site at m4cgyver.net (Wayback capture of 2023-10-29). CSS comments saying "copied from old site" point at that version.
- View counting: `components/views/ViewPixel.tsx` sends a 1x1 tracking image on each pathname change, with a stable request ID for retries and a referrer stripped of query strings. A `<noscript>` pixel supports visits without JavaScript. The tracker checks the same-host `Referer`, sets a year-long `viewer` cookie and a sliding 30-minute `view_session` cookie, and records timestamped visits. `ViewCounter` waits for tracking, then fetches `/api/views?path=`; it resets the table on navigation, times out stalled requests, retries counts twice automatically, and shows a Retry button on failure.
  - The data lives in `databases/views.sqlite` (gitignored), via `lib/views.ts`. It uses `bun:sqlite` when the server runs on Bun (`bun --bun next …`) and `node:sqlite` on Node. Plain `bun dev` runs Next on Node, which logs an ExperimentalWarning for SQLite.
  - Both modules load through `process.getBuiltinModule`, so don't turn that into an `import`: Turbopack would try to resolve `bun:sqlite`, and `@types/node` 20 has no `node:sqlite` types.
  - Migration automatically preserves unique counts from the original `views` table, which becomes a frozen legacy archive. Old repeat-load counts, timestamps, sessions, and sources cannot be recovered. New load counting starts at the `page_loads_since` timestamp in `view_metadata`.
  - `view_events` stores individual loads, timestamp, viewer, session, path, referrer, and direct/internal/external/unknown source. `view_sessions` stores session entry attribution and first/last activity. Detailed events, inactive sessions, and daily deduplication identities are pruned on the first recorded visit of each server-local day after 90 days by default; configure a positive integer `VIEW_EVENT_RETENTION_DAYS` to change this.
  - `view_daily` and `view_totals` retain daily and lifetime unique/load summaries. Lifetime `view_visitors` identities remain to keep unique totals exact. The counter reads indexed summaries; it never scans all visit events. Writes and aggregate updates commit in one transaction, with request IDs preventing duplicate loads on retries.
  - The existing Page/Site × Today/Total table still shows unique viewers. The API adds `pageLoads.page`, `pageLoads.site` (each Today/Total), and `pageLoads.since`. Source attribution is best effort; a no-JS visit has an unknown source.
  - Run `bun scripts/check-views.ts` for isolated migration, counting, session, retention, and rollback checks. It writes to a disposable temporary database, never the site's database.
- Several layout values exist only to stop the layout shifting between pages or when a scrollbar appears: the fixed `13rem` nav column, the top-anchored grid, the `100vw`-sized background and the `100vw`-based centering offset. The CSS comments explain each one, so read them before changing these.

- The StartupOS page (`/projects/startupos/`) runs the OS's floppy image (`public/projects/startupos/system.img`) in the v86 PC emulator, through `components/v86-emulator/V86Emulator.tsx`.
  - v86's runtime files live in `public/v86/`. `libv86.js` and `v86.wasm` are copied from `node_modules/v86/build/` and must match the installed version, which is why `v86` is pinned to an exact version in `package.json`. Re-copy both after upgrading. `seabios.bin` and `vgabios.bin` come from v86's GitHub repo.
  - The component loads `libv86.js` with a script tag instead of `import("v86")`. When Next bundles v86, it gives v86 a `process` shim, so v86 takes its Node.js code path and crashes calling `setImmediate`. The npm package is still used for its TypeScript types.

## Styling

- Pages are styled with CSS Modules, not Tailwind utilities. Tailwind 4 is imported in `globals.css`, but its only utilities in use are the few on `<html>` and `<body>` in `app/layout.tsx`. Its preflight still applies everywhere and strips default styles from bare elements such as `h1`, `ul` and `li`, so raw HTML content needs a scoped class to restyle it, like the blog post's `.prose`. It also gives every `img` `max-width: 100%; height: auto`, so images meant to overflow or keep a fixed size need those overridden (see the pizza cube and the 88x31 buttons).
- Shared classes live in `components/main/styles.module.css`. Page-specific classes go in a `page.module.css` next to the page.
- `.list` is defined twice in `styles.module.css`. The later definition overrides the earlier one wherever they conflict.
- Fonts come in as CSS variables set by `next/font` in `app/layout.tsx`:
  - `--font-toshiba`: a local retro font (`public/fonts/Toshiba-TXL1.woff`), used site-wide.
  - `--font-geist-sans`: used for body copy (`.bodyText`, `.title`, `.prose`).
  - `--font-mario`: Mario World Pixel Color, a color (COLR) font used by `.brand` for header titles.
  - `--font-eagle`: EagleSpCGA, used on the slideshow cards.
  - `--font-verite`: Verite 9x14, used for the home page intro.

## Content

All content is hardcoded:

- Blog posts are listed in `lib/posts.ts` (slug, title, description, `published`/`updated` dates, tags). The blog index, the sitemap, each post's metadata and its JSON-LD all read from it.
- Each post is its own hand-written static route at `app/blogs/<slug>/page.tsx`. To add a post, add an entry to `lib/posts.ts` and create the route folder. The page calls `getPost(slug)`, exports `postMetadata(info)`, renders `<JsonLd data={postJsonLd(info)} />`, and wraps its table of contents in `components/post-sidebar/PostSidebar.tsx`. The sidebar adds the "Post Info" window (author, published and last-updated dates) and a "Resources" window of the post's external links, and keeps the table of contents sticky.
- When a post's content changes, set its `updated` date. The visible "Last updated" date and the JSON-LD `dateModified` both come from that field.
- The slideshow cards are a `slides` array in `components/slideshow/Slideshow.tsx` (the image is optional), and the 88x31 buttons are a `frens` array in `components/sidebar/Sidebar.tsx`. Card text is sized in container-query units (`cqi`), so it scales with the card instead of getting cut off.
- Internal page navigation uses Next.js Link and canonical paths. External sites, files and same-page anchors use regular anchors.
- Unknown routes land on the 404 page (`app/not-found.tsx`). The old site's friend pages (Bic, Casmier, Cookie, Neo) were left out on purpose.

## SEO

- `lib/seo.ts` holds the site settings, including the canonical domain `https://m4cgyver.net`. It's used as `metadataBase` and as the base for every absolute URL.
- The root layout sets the defaults and a title template, `%s | M4cgyver`. Every page builds its metadata with `pageMetadata({ title, description, path })`, which sets the canonical URL and a full Open Graph block. Omit `title` to get the bare site name, as the home page does.
- Metadata merges shallowly: a page's `openGraph` replaces the root's completely. That's why `pageMetadata` lists `/opengraph-image` itself instead of relying on the file convention.
- Static pages set explicit Twitter metadata with the branded share image. Articles use a summary card unless a real cover is declared.
- JSON-LD is rendered with `components/seo/JsonLd.tsx`:
  - static pages use `sitePageJsonLd`, including WebSite and Person on the homepage and breadcrumbs on other pages;
  - ArticleShell renders BlogPosting plus breadcrumbs with `buildPostJsonLd`.
- `app/sitemap.ts` combines `lib/site-pages.ts` with published posts from `lib/posts.ts`. Add new static public pages to the shared registry. `app/robots.ts` allows everything except `/api/`.
- Icons:
  - `app/favicon.ico`, `icon.png` and `apple-icon.png` are generated from `public/main/floppy.png`, a 64x64 floppy disk.
  - The `.ico` holds smooth downscales; nearest-neighbor turns the 16 and 32px sizes into noise. The PNGs are crisp nearest-neighbor upscales.
- `app/opengraph-image.tsx` renders the 1200x630 share image: the "Title" window, `public/main/floppy-384.png` on the left and the site name in the Toshiba font on the right. It reads its files with `readFile` from `process.cwd()`.

## Deployment

- The site runs in Docker behind nginx. The `Dockerfile` builds with `bun --bun next build` and ships only the standalone server (`output: "standalone"` in `next.config.ts`), running `bun server.js` on `oven/bun:1-slim`.
- The server runs on the Bun runtime, so `lib/views.ts` uses `bun:sqlite`. The database is in `/app/databases`. Mount a volume there, owned by uid 1000 (the image's `bun` user), or the counts reset with every new container.
- In the production server, `request.nextUrl` takes its host from the bind address (`0.0.0.0:3000` in Docker), not from the request. Use the `Host` header when you need the real host, as the view tracker does.

## Design sync (claude.ai/design)

`.design-sync/` configures bundling of the site's components into a claude.ai/design design system. It is committed.

- `entry.tsx` is the bundle entry. The bundler skips default exports, so each default-exported component must be re-exported there as a named export.
- `config.json` has a `componentSrcMap` that maps component names to source files.
- `ds-tokens.css` defines the font variables that `next/font` would normally inject at runtime.
- `tsconfig.bundle.json` maps `/main/*` to `public/main/*` so that CSS `url()`s resolve.

When you add a component to the design system, update both `entry.tsx` and `componentSrcMap`. `.ds-sync/` (converter scripts and state) and `ds-bundle/` (build output) are gitignored and generated.

## Reusable blog publishing

- `lib/posts.ts` is the only explicit post registry. Keep bodies in their existing static TSX routes; do not add a parallel dynamic route or content DSL. `status` means `published` or `draft`; use `badge` for a display label.
- `lib/blog/` owns typed contracts, author lookup, calendar dates, canonical URLs, metadata, JSON-LD, related links and validation. `lib/site.ts` is canonical site configuration. `lib/seo.ts` retains generic page metadata and compatibility exports.
- A post route calls `buildPostMetadata(info)` and wraps its TSX in `ArticleShell post={info}`. `ArticleShell` composes the existing retro header, sidebar, Contents and Window components. The semantic outer article uses `display: contents` to retain the root grid; root layout already owns main. ArticleLayout's `asArticle={false}` avoids nesting articles while preserving its default for project pages.
- Title, dates, author, summary, resources and TOC manifest live in the record. Preserve existing anchor IDs. Navigation remains last and sticky; author/resources remain above it. Post bodies still support diagrams, commands, tables and live demos.
- Set real publication/update dates manually. A metadata-only migration does not require an updated date. Never use the build clock for sitemap lastmod.
- Covers are optional real local assets with dimensions, informative alt text and captions. ArticleFigure renders them. Do not label generic slideshow artwork as evidence or invent representative screenshots. Coverless articles omit BlogPosting.image and use a Twitter summary card. Next's root file-based OG image may still supply branded share art.
- Related links are explicitly curated published slugs, not automatic crosslinks. No current related pair is declared between the unrelated CSS and Intel posts.
- SEO builders/registry use the `server-only` marker. Bun test preload mocks only that marker; the standalone localhost audit uses a dedicated preload to run server modules outside Next.
- Run `bun run test:seo`, `bun run check:seo [http://localhost:PORT]`, typecheck, targeted lint and a build. The audit covers registered articles and static pages, robots, sitemap, declared cover assets, the local branded share image, and one fixed missing route for HTTP 404/noindex. Never execute published commands or crawl localhost URLs embedded in article examples.
- Intel-only editorial evidence stays in its route's SetupNotes.tsx. Unrecorded versions and hardware results must remain unclaimed. Companion templates in docs/examples/intel-npu are local review material, not a published companion project.

## Site-wide page SEO

- `lib/site-pages.ts` owns metadata and breadcrumb hierarchy for the homepage, blog index, project index/details, contact and games. Project cards use its project records too; new static public pages belong here.
- Each static page exports `sitePageMetadata(info)` and renders `sitePageJsonLd(info)`. The homepage owns the WebSite/Person entities; other pages reference those stable identities. Collections list only actual published entries; project notes use CreativeWork, not invented product/offer/review data.
- `PageBreadcrumbs` renders the same hierarchy as JSON-LD inside the existing content windows. Root and article layouts remain unchanged. The homepage introduction is H2 under the existing PageHeader H1.
- The sitemap unions static page records with published blog records. Preserve authentic lastModified values and omit unknown dates. Shared canonical/OG/Twitter URLs use the production origin; internal navigation uses non-trailing-slash canonical paths.

- Navigation links between this app's pages use `next/link`. Use regular anchors for external sites, mailto links, static PDF/image downloads, and same-page fragment navigation. Do not rewrite instructional code samples as live application links.
