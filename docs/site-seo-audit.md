# Site SEO audit — October 11, 2026

## Implemented

- Restored H1 semantics in the shared PageHeader. The retro title styling is unchanged; static pages had no H1 when this component rendered H2.
- Removed trailing slashes from four sidebar detail links to match canonical routes and avoid redirects.
- Added useful homepage, blog and project links to the empty 404 window, retaining noindex and untracked views.
- Expanded `bun run check:seo` to all seven static pages as well as both published articles. It checks initial HTML, headings, metadata, schema identities, visible breadcrumbs, canonical internal links, complete sitemap coverage, local branded share-image responses, and a real HTTP 404 with noindex.
- Added a regression fixture for static-page headings, noindex and canonical metadata. The homepage check accounts for equivalent origin URLs with or without a trailing slash.

## Verification and remaining work

The localhost audit passes for all nine published routes. The Bun SEO suite passes 31 tests. These checks do not establish production indexing or rankings.

After deployment, inspect canonical selection and indexing in Google Search Console and submit the production sitemap. Review real-user Core Web Vitals when data is available. Exact Intel hardware/software evidence and original article screenshots remain editorial work; the site must not invent results or representative images.

The audit only fetches registered routes, discovery files, declared covers, the known local share-image endpoint, and one fixed missing path. It does not follow external links or execute commands from articles.
