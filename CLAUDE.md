# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

This is a personal site, "M4cgyvers Repurposed Mining Rig", built with Next 16.2 (App Router), React 19.2, TypeScript and Bun. There is no test framework.

## Commands

```bash
bun install
bun dev                      # http://localhost:3000
bun run build
bunx tsc --noEmit            # typecheck
bunx eslint app components lib   # lint (see below for why not `bun run lint`)
```

- Use `bunx tsc`, not `npx tsc`. On Windows, Bun installs the `.bin` shim as `tsc.exe`/`tsc.bunx`, which npx doesn't find, so `npx tsc` prints "This is not the tsc command you are looking for".
- `bun run lint` runs a bare `eslint` over the whole directory. The flat config in `eslint.config.mjs` doesn't read `.gitignore`, so it also lints the generated `ds-bundle/` and `.ds-sync/` directories and reports over a thousand problems. Lint `app components lib` instead, or add those directories to `globalIgnores`.
- `next.config.ts` pins `turbopack.root` to this folder. Without it, Turbopack picks the parent folder (it has the legacy app's `package-lock.json`) as the workspace root and watches both apps and `current.zip`. That made `next dev` balloon in memory and serve stale builds.
- If a page renders without CSS in dev after a hot update, stop the server, delete `.next`, and start it again.

## Layout model

- `app/layout.tsx` renders the whole page chrome: a fixed background image, a grain overlay, a centered container whose height follows the content, and a CSS grid that already holds the slideshow and the footer. Pages render directly into that grid, so a page returns a fragment of grid children, not a full layout.
- The grid is defined in `components/main/styles.module.css` with the template areas `header`, `slideshow`, `navigation-lhs`, `content` and `footer`. When the grid contains the top navigation bar, a `:has()` rule adds a `topnav` row under the header. Pages place each child into an area by passing the matching class: `styles.header`, `styles.navLhs` or `styles.contentArea`. Below 768px the grid collapses to a single column.
- Two route groups decide who fills the nav area:
  - Pages under `app/(navigation layout)/` get `components/sidebar/Sidebar.tsx` from that group's `layout.tsx`: the site navigation, the "Views" counter and the "Frens and Interests" 88x31 buttons, stacked in the nav area.
  - Pages under `app/(no navigation layout)/` must render their own `styles.navLhs` block. The blog post puts an in-page table of contents of `#anchor` links there. That group's `layout.tsx` adds the old site's horizontal bar (`components/top-navigation/`) for site navigation, plus a tracking pixel.
  - `app/not-found.tsx` sits outside both groups, so it renders `<Sidebar trackViews={false} />` itself, so 404s aren't counted.
- `components/window/Window.tsx` is the one shared UI primitive: a frosted-glass panel with an optional gradient title bar. Use `className` to set its grid area and `bodyStyle` to override its padding.
- Most pages build their header window with `components/page-header/PageHeader.tsx`, which adds the spinning pizza cube (`components/pizza-cube/`, plays `public/sounds/boom.mp3` on click). The blog post still writes its header `Window` by hand.
- The look and most of the text come from the 2023 site at m4cgyver.net (Wayback capture of 2023-10-29). CSS comments saying "copied from old site" point at that version.
- View counting: `components/views/ViewPixel.tsx` is a 1x1 `<img>` pointing at `/api/views/tracker`. That route reads the viewed page from the request's `Referer` (same host only), sets a year-long `viewer` cookie, and records one row per viewer, page and day. `ViewCounter` (the Views window) waits for its pixel to load, then fetches `/api/views?path=` for the Page/Site × Today/Total table.
  - The data lives in `databases/views.sqlite` (gitignored), via `lib/views.ts`. It uses `bun:sqlite` when the server runs on Bun (`bun --bun next …`) and `node:sqlite` on Node. Plain `bun dev` runs Next on Node, which logs an ExperimentalWarning for SQLite.
  - Both modules load through `process.getBuiltinModule`, so don't turn that into an `import`: Turbopack would try to resolve `bun:sqlite`, and `@types/node` 20 has no `node:sqlite` types.
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
- Each post is its own hand-written static route at `app/(no navigation layout)/blogs/<slug>/page.tsx`. To add a post, add an entry to `lib/posts.ts` and create the route folder. The page calls `getPost(slug)`, exports `postMetadata(info)`, renders `<JsonLd data={postJsonLd(info)} />`, and wraps its table of contents in `components/post-sidebar/PostSidebar.tsx`. The sidebar adds the "Post Info" window (author, published and last-updated dates) and a "Resources" window of the post's external links, and keeps the table of contents sticky.
- When a post's content changes, set its `updated` date. The visible "Last updated" date and the JSON-LD `dateModified` both come from that field.
- The slideshow cards are a `slides` array in `components/slideshow/Slideshow.tsx` (the image is optional), and the 88x31 buttons are a `frens` array in `components/sidebar/Sidebar.tsx`. Card text is sized in container-query units (`cqi`), so it scales with the card instead of getting cut off.
- Internal links are plain `<a>` tags with trailing slashes (`/blogs/`, `/contact/`). `@next/next/no-html-link-for-pages` flags a literal `href="/"`, so links to the home page carry an eslint-disable comment.
- Unknown routes land on the 404 page (`app/not-found.tsx`). The old site's friend pages (Bic, Casmier, Cookie, Neo) were left out on purpose.

## SEO

- `lib/seo.ts` holds the site settings, including the canonical domain `https://m4cgyver.net`. It's used as `metadataBase` and as the base for every absolute URL.
- The root layout sets the defaults and a title template, `%s | M4cgyver`. Every page builds its metadata with `pageMetadata({ title, description, path })`, which sets the canonical URL and a full Open Graph block. Omit `title` to get the bare site name, as the home page does.
- Metadata merges shallowly: a page's `openGraph` replaces the root's completely. That's why `pageMetadata` lists `/opengraph-image` itself instead of relying on the file convention.
- Twitter metadata isn't set per page. Next fills the twitter title, description and image in from Open Graph, and the root sets `summary_large_image`.
- JSON-LD is rendered with `components/seo/JsonLd.tsx`:
  - the home page renders WebSite and Person (`homeJsonLd`);
  - every other page renders a `breadcrumbJsonLd` trail;
  - posts render BlogPosting plus breadcrumbs (`postJsonLd`).
- `app/sitemap.ts` lists the routes and pulls the posts from `lib/posts.ts`. Add new non-post pages there by hand. `app/robots.ts` allows everything except `/api/`.
- Icons:
  - `app/favicon.ico`, `icon.png` and `apple-icon.png` are generated from `assets/floppy.png`, a 64x64 floppy disk.
  - The `.ico` holds smooth downscales; nearest-neighbor turns the 16 and 32px sizes into noise. The PNGs are crisp nearest-neighbor upscales.
- `app/opengraph-image.tsx` renders the 1200x630 share image: the "Title" window, `assets/floppy-384.png` on the left and the site name in the Toshiba font on the right. It reads its files with `readFile` from `process.cwd()`.

## Design sync (claude.ai/design)

`.design-sync/` configures bundling of the site's components into a claude.ai/design design system. It is committed.

- `entry.tsx` is the bundle entry. The bundler skips default exports, so each default-exported component must be re-exported there as a named export.
- `config.json` has a `componentSrcMap` that maps component names to source files.
- `ds-tokens.css` defines the font variables that `next/font` would normally inject at runtime.
- `tsconfig.bundle.json` maps `/main/*` to `public/main/*` so that CSS `url()`s resolve.

When you add a component to the design system, update both `entry.tsx` and `componentSrcMap`. `.ds-sync/` (converter scripts and state) and `ds-bundle/` (build output) are gitignored and generated.
