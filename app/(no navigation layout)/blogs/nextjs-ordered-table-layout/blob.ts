export const basicGridTemplateExample = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grid Template Areas Example</title>

  <style>
    * {
      box-sizing: border-box;
    }

    /* Our body will have the main grid container, and we will define the 
    /* grid-template-areas for the layout. The header and footer will span 
    /* the full width, while the sidebar and main content will be side by side.
    */
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;

      grid-template-areas:
        "header header"
        "sidebar content"
        "footer footer";

      grid-template-columns: 220px 1fr;
      grid-template-rows: auto 1fr auto;

      font-family: Arial, sans-serif;
      background: #f4f4f4;
    }

    /* Now we will assign each element to its respective grid area. */
    /* The header will be at the top, spanning both columns. */
    header {
      grid-area: header;
      padding: 24px;
      background: #263238;
      color: white;
    }

    /* The sidebar will be on the left, and will have a background color. */
    nav {
      grid-area: sidebar;
      padding: 24px;
      background: #e0e0e0;
    }

    nav a {
      display: block;
      margin-bottom: 16px;
      color: #263238;
    }

    /* The main content will be on the right, and will have a white background. */
    main {
      grid-area: content;
      min-width: 0;
      padding: 24px;
      background: white;
    }

    /* The footer will be at the bottom, spanning both columns. */
    footer {
      grid-area: footer;
      padding: 20px;
      background: #263238;
      color: white;
      text-align: center;
    }

    /* For smaller screens, we will stack the elements vertically. */
    @media (max-width: 600px) {
      body {
        grid-template-areas:
          "header"
          "sidebar"
          "content"
          "footer";

        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr auto;
      }
    }
  </style>
</head>

<body>
  <!-- The body already has the grid container, so we just need to assign the elements 
  to their respective grid areas. -->  

  <!-- The header will be at the top, spanning both columns. -->
  <header>
    <h1>My Website</h1>
  </header>

  <!-- The footer will be at the bottom, spanning both columns. -->
  <footer>
    My Website &copy; 2026
  </footer>

  <!-- The sidebar will be on the left, and will have a background color. -->
  <nav aria-label="Main navigation">
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </nav>

  <!-- The main content will be on the right, and will have a white background. -->
  <main>
    <h2 id="home">Main Content</h2>
    <p>This area fills the remaining width beside the navigation.</p>

    <h2 id="about">About</h2>
    <p>Each element is placed using its named grid area.</p>

    <h2 id="contact">Contact</h2>
    <p>hello@example.com</p>
  </main>
</body>
</html>
`
export const projectStructure = `
lib/
└── styles.module.css       -- the grid container and one class per named area
components/
└── page-views/
    ├── PageViews.tsx       -- the views box each page places in the stats area
    └── styles.module.css   -- how the views box looks
app/
├── globals.css             -- base styles for the whole site
├── layout.tsx              -- the grid container, header, footer, navigation and filler
├── page.tsx                -- the home page's content area and page views
├── page.module.css         -- how the home page's content looks
├── about/
│   ├── page.tsx            -- the about page's content area and page views
│   └── page.module.css     -- how the about page's content looks
└── contact/
    ├── page.tsx            -- the contact page's content area and page views
    └── page.module.css     -- how the contact page's content looks
`

export const gridStylesExample = `
/* The shared grid container. It defines the grid-template-areas for the
/* whole app. The header and footer span the full width, while the left
/* column (sidebar, stats and filler) sits beside the content area.
/*
/* Anything that should land in one of these areas must be a direct child of
/* this element, no matter which layout or page file renders it.
*/
.grid {
  min-height: 100vh;
  display: grid;

  grid-template-areas:
    "header header"
    "sidebar content"
    "stats content"
    "filler content"
    "footer footer";

  grid-template-columns: 220px 1fr;
  /* One size per row: the filler row takes the leftover height, so the
  /* sidebar and stats stay their natural size at the top of the column. */
  grid-template-rows: auto auto auto 1fr auto;
}

/* Now each area gets a class that components can opt into. */
/* The header will be at the top, spanning both columns. */
.header {
  grid-area: header;
  padding: 24px;
  background: #263238;
  color: white;
}

.header h1 {
  margin: 0;
}

/* The sidebar will be on the left, and will have a background color. */
.sidebar {
  grid-area: sidebar;
  padding: 24px;
  background: #e0e0e0;
}

.sidebar a {
  display: block;
  margin-bottom: 16px;
  color: #263238;
}

/* The stats sit under the sidebar. Pages that want stats render their own
/* element with this class. */
.stats {
  grid-area: stats;
  padding: 24px;
  background: #e0e0e0;
  border-top: 1px solid #cfd8dc;
}

/* The filler has nothing inside. It soaks up the rest of the left column so
/* the sidebar and stats don't stretch to match the content's height. */
.filler {
  grid-area: filler;
  background: #e0e0e0;
}

/* The content area will be on the right, and will have a white background.
/* Each page renders its own <main> with this class. */
.content {
  grid-area: content;
  min-width: 0;
  padding: 24px;
  background: white;
}

/* The footer will be at the bottom, spanning both columns. */
.footer {
  grid-area: footer;
  padding: 20px;
  background: #263238;
  color: white;
  text-align: center;
}

/* For smaller screens, we will stack the areas vertically. */
@media (max-width: 600px) {
  .grid {
    grid-template-areas:
      "header"
      "sidebar"
      "stats"
      "content"
      "footer";

    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto 1fr auto;
  }

  /* Once everything stacks there is no leftover height to fill. */
  .filler {
    display: none;
  }
}
`

export const globalStylesExample = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f4f4;
}
`

export const rootLayoutExample = `
import type { Metadata } from "next";
import Link from "next/link";
import grid from "@/lib/styles.module.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "My Website",
    template: "%s | My Website",
  },
  description: "Grid template areas in the Next.js App Router",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {/* The grid container lives on a wrapper rather than <body>, so nothing
        that Next.js or a browser extension injects into <body> can end up as
        a stray grid item. */}
        <div className={grid.grid}>
          {/* The header will be at the top, spanning both columns. */}
          <header className={grid.header}>
            <h1>My Website</h1>
          </header>

          {/* The footer is written above the navigation and the page, but the
          grid template still places it at the bottom. */}
          <footer className={grid.footer}>My Website &copy; 2026</footer>

          {/* The sidebar will be on the left. */}
          <nav className={grid.sidebar} aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>

          {/* The filler is empty. It fills the rest of the left column. */}
          <div className={grid.filler} />

          {/* Each page renders its own <main className={grid.content}> and
          <PageViews>, which fill the content and stats areas. Both become
          direct children of the grid container right here. */}
          {children}
        </div>
      </body>
    </html>
  );
}
`

export const homePageExample = `
import PageViews from "@/components/page-views/PageViews";
import grid from "@/lib/styles.module.css";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <main className={\`\${grid.content} \${styles.main}\`}>
        <h2>Main Content</h2>
        <p>This area fills the remaining width beside the navigation.</p>
        <p>
          It is rendered by <code>app/page.tsx</code>, but it lands in the{" "}
          <code>content</code> area defined in <code>lib/styles.module.css</code>,
          even though the layout renders it after the footer.
        </p>
        <p>
          The views box under the navigation comes from <code>app/page.tsx</code>{" "}
          too. It lands in the <code>stats</code> area, between the navigation
          and the filler that the layout renders.
        </p>
      </main>

      <PageViews today={12} total={340} />
    </>
  );
}
`

export const homePageStylesExample = `
/* Styles for the home page's content area. The grid placement comes from
/* lib/styles.module.css; this file only handles how the page looks. */
.main h2 {
  margin-top: 0;
}

.main code {
  padding: 2px 4px;
  background: #eceff1;
  border-radius: 4px;
}
`

export const pageViewsExample = `
import grid from "@/lib/styles.module.css";
import styles from "./styles.module.css";

type Views = {
  today: number;
  total: number;
};

// Example numbers. A real site would read these from its analytics.
const site: Views = { today: 58, total: 2914 };

// Each page renders this with its own numbers. The grid.stats class places it
// in the stats area under the layout's navigation.
export default function PageViews({ today, total }: Views) {
  const rows = [
    { label: "Page", today, total },
    { label: "Site", ...site },
  ];

  return (
    <aside className={\`\${grid.stats} \${styles.stats}\`} aria-label="Page views">
      <h3>Views</h3>
      <div className={styles.row}>
        <span />
        <span>Today</span>
        <span>Total</span>
      </div>
      {rows.map(({ label, today, total }) => (
        <div key={label} className={styles.row}>
          <span>{label}</span>
          <span>{today.toLocaleString("en-US")}</span>
          <span>{total.toLocaleString("en-US")}</span>
        </div>
      ))}
    </aside>
  );
}
`

export const pageViewsStylesExample = `
/* The page views box in the stats area. Grid placement comes from
/* lib/styles.module.css. */
.stats h3 {
  margin: 0 0 12px;
}

.row {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.row span:first-child {
  flex: 1;
}

.row span:not(:first-child) {
  width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
`

export const aboutPageExample = `
import type { Metadata } from "next";
import PageViews from "@/components/page-views/PageViews";
import grid from "@/lib/styles.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
};

const areas = [
  { element: "<header>", area: "header", file: "app/layout.tsx" },
  { element: "<nav>", area: "sidebar", file: "app/layout.tsx" },
  { element: "<aside>", area: "stats", file: "app/about/page.tsx" },
  { element: "<div>", area: "filler", file: "app/layout.tsx" },
  { element: "<main>", area: "content", file: "app/about/page.tsx" },
  { element: "<footer>", area: "footer", file: "app/layout.tsx" },
];

export default function About() {
  return (
    <>
      <main className={\`\${grid.content} \${styles.main}\`}>
        <h2>About</h2>
        <p>Each element is placed using its named grid area.</p>

        <ul className={styles.areas}>
          {areas.map(({ element, area, file }) => (
            <li key={area} className={styles.area}>
              <code className={styles.element}>{element}</code>
              <span>grid-area: {area}</span>
              <span className={styles.file}>{file}</span>
            </li>
          ))}
        </ul>
      </main>

      <PageViews today={5} total={128} />
    </>
  );
}
`

export const aboutPageStylesExample = `
/* Styles for the about page's content area. */
.main h2 {
  margin-top: 0;
}

/* The cards wrap onto new lines as the content area gets narrower. */
.areas {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 160px;
  padding: 12px 16px;
  background: #eceff1;
  border-left: 4px solid #263238;
  border-radius: 4px;
}

.element {
  font-size: 1.1rem;
  font-weight: bold;
}

.file {
  font-family: monospace;
  color: #546e7a;
}
`

export const contactPageExample = `
import type { Metadata } from "next";
import PageViews from "@/components/page-views/PageViews";
import grid from "@/lib/styles.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
};

export default function Contact() {
  return (
    <>
      <main className={\`\${grid.content} \${styles.main}\`}>
        <h2>Contact</h2>
        <p>
          <a className={styles.email} href="mailto:hello@example.com">
            hello@example.com
          </a>
        </p>
      </main>

      <PageViews today={2} total={57} />
    </>
  );
}
`

export const contactPageStylesExample = `
/* Styles for the contact page's content area. */
.main h2 {
  margin-top: 0;
}

.email {
  font-size: 1.25rem;
  color: #263238;
}
`

export const layoutComparison = `
HTML example                Next.js project
┌──────────────────────┐    ┌──────────────────────┐
│ header               │    │ header               │
├─────────┬────────────┤    ├─────────┬────────────┤
│ sidebar │ content    │    │ sidebar │ content    │
│         │            │    ├─────────┤            │
│         │            │    │ stats   │            │
│         │            │    ├─────────┤            │
│         │            │    │ filler  │            │
├─────────┴────────────┤    ├─────────┴────────────┤
│ footer               │    │ footer               │
└──────────────────────┘    └──────────────────────┘
`

export const addingAreaExample = `
.grid {
  min-height: 100vh;
  display: grid;

  grid-template-areas:
    "header header"
    "sidebar content"
    "stats content"
    "tags content"
    "filler content"
    "footer footer";

  grid-template-columns: 220px 1fr;
  grid-template-rows: auto auto auto auto 1fr auto;
}

/* Any element with this class lands between the stats and the filler,
/* no matter which layout or page renders it. */
.tags {
  grid-area: tags;
}
`

export const movingAreaExample = `
.grid {
  min-height: 100vh;
  display: grid;

  /* The stats now get their own column on the right. */
  grid-template-areas:
    "header header header"
    "sidebar content stats"
    "filler content stats"
    "footer footer footer";

  grid-template-columns: 220px 1fr 220px;
  grid-template-rows: auto auto 1fr auto;
}
`

export const runProjectExample = `
git clone https://github.com/Lrios4403/NextJS-Ordered-Table-Layout.git
cd NextJS-Ordered-Table-Layout
bun install
bun dev
`
