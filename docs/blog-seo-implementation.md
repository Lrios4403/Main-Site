# Reusable blog SEO implementation — 2026-10-11

## Rollback and scope

The pre-migration site is saved at commit `01b5842`, tag `checkpoint-before-blog-seo-2026-10-11`, on `restore-old-site`.

This implements the reusable website publishing layer from handoff v1.2. It adapts existing source instead of introducing a second registry, routing system, CMS or SEO Agent platform. No remote push or deployment is included.

## Findings and changes

| Classification | Finding / action |
| --- | --- |
| Confirmed in source | Both articles already had H1/H2/H3 structure, canonical metadata, JSON-LD and a shared registry. The reported debug sentence was already absent. These were extended rather than treated as missing. |
| Confirmed in source | Root layout owns main and named grid areas. ArticleShell uses a semantic article with display: contents; it composes existing Windows and avoids nested main/article landmarks. |
| Confirmed in source | Resource lists, section manifests and layout markup were duplicated in routes. They now come from each typed record and the shared shell. |
| Confirmed in source | BlogPosting previously called generic site artwork the article image, and always emitted dateModified. Covers and actual update dates are now optional. |
| Confirmed in source | Existing publication dates are preserved. CSS post update remains October 10; Intel's October 11 update reflects substantive editorial additions. |
| Verified locally | Both routes return HTTP 200 and include one article/H1, body, metadata, dates, breadcrumbs, matching schema IDs and working section references in initial HTML. |
| Verified locally | Blog index, sitemap lastmod and robots are consistent with published registry entries. A draft fixture is excluded from public discovery. |
| Verified visually | Both articles checked at desktop 1280 × 900 and mobile 390 × 844. Retro titles, window chrome, top buttons, sidebar spacing and scrolling code remain. No horizontal page overflow. Intel verification anchor works by keyboard. |
| Editorial addition | Intel quick start, recorded-environment/outcome tables, first-download guidance, inference template, troubleshooting, glossary and update notes. Original commands, model IDs and old anchors remain. |
| Requires owner data | Exact Windows build, processor/NPU generation, driver, OVMS release, model revision, inference/device/tool-call logs and screenshots. No new hardware execution is claimed. |

## Architecture

- `lib/posts.ts`: the single explicit registry; published-only listing and lookup. `status` is publication state, `badge` is optional display text.
- `lib/site.ts`: canonical origin and existing site identity.
- `lib/blog/`: type contracts, authors, URLs, strict calendar dates, metadata, schema, curated related resolution and validation. Server-only markers prevent accidental client imports of registry/builders.
- `components/article/ArticleShell.tsx`: shared header, byline, sidebar, TOC, breadcrumbs, optional cover and related links. Existing body code remains independent TSX.
- `ArticleFigure`: local image dimensions, alt, caption and optional attribution. No representative cover is currently declared because the Intel slideshow art is promotional artwork, not a test screenshot.
- `ArticleTable`: optional semantic tables with a keyboard-accessible horizontal scroll region.
- `scripts/seo/`: Bun unit/negative-fixture tests and bounded localhost HTML audit. No arbitrary crawling and no execution of article snippets.

The unrelated CSS article proves the shell does not depend on NPU fields. No automatic related links are added between these different topics. No article database is needed.

Next's file-based root Open Graph image can still provide branded share art. It is not represented as a technical screenshot in BlogPosting. Article records with a real cover override the preview and use a large Twitter card; coverless records request a summary card.

## Checks completed

- `bun run test:seo`: 30 passing tests, including malformed HTML/JSON-LD, duplicate records/sections, invalid and future dates, optional cover/update, author fixtures, drafts, missing images and wrong dimensions.
- `bun run check:seo http://localhost:3000`: both published articles, blog index, sitemap and robots pass.
- `bunx tsc --noEmit`: pass.
- Targeted ESLint on changed source and SEO scripts: pass.
- `bun run build`: pass, all 19 routes generated; both existing blog routes retained.
- PowerShell parser check for companion inference template: pass. The script was not executed against model hardware.
- Desktop/mobile visual review: pass for current Chromium browser. This is a manual review, not a cross-browser screenshot-baseline suite.

Windows sandbox permissions prevented an initial build and localhost connection; the same operations succeeded with approved local execution. The existing dev server remains on port 3000.

## What remains unverified

1. Hardware-backed reproducibility: first pull, subsequent launch, exact API base, inference, NPU execution and tool calls must be checked against the owner's actual pinned environment. The 2026 documentation example is explicitly labeled as documentation-derived, not locally verified. The original `/v1` client examples remain with version guidance rather than being silently changed to `/v3`.
2. Real screenshots/benchmarks: add only genuine evidence, with dimensions and factual captions. No video or demonstration evidence was manufactured.
3. Companion publication: `docs/examples/intel-npu/` holds local v0.1 worksheets and a localhost-only PowerShell request template. A separate public repository has not been created or linked.
4. Production Search Console, Rich Results Test and field Core Web Vitals: not measured or submitted. Local success is not proof of production indexing, ranking or real-user performance. After deployment, inspect both URLs, validate schema in Google's tools and record available field data before making performance claims.
5. External resource availability: preserved links and official source references were inspected selectively; this is not a comprehensive external-link crawl.

## Adding another post

1. Add a typed record in `lib/posts.ts` with stable slug/path, author, authentic dates, summary and sections. Leave cover/updated absent when not applicable. Related slugs must be explicitly approved published articles.
2. Create the existing-style static `app/blogs/<slug>/page.tsx` route. Export `buildPostMetadata(getPost(slug))`; render the body inside ArticleShell within `SiteLayout variant="detail"`. Keep commands and special content in TSX.
3. Use explicit heading IDs matching the manifest. Do not rename published anchors without retaining old destinations.
4. Run the unit tests, localhost audit, typecheck, lint and build. Inspect desktop/mobile, images and keyboard navigation.
5. The published registry automatically supplies the index and sitemap. Draft metadata is noindex/nofollow; a static draft route is still publicly accessible if deployed, so keep confidential drafts out of deployed routes entirely.

## References

- Installed Next 16.2.9 documentation: JSON-LD, Metadata/OG images, sitemap, server/client components and CSS.
- [OpenVINO 2026 NPU serving demo](https://docs.openvino.ai/2026/model-server/ovms_demos_llm_npu.html): preparation versus serving, documented model and API example.
- [OpenVINO model preparation](https://docs.openvino.ai/2026/model-server/ovms_docs_pull.html).
- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article).
- [Google publication dates](https://developers.google.com/search/docs/appearance/publication-dates).
