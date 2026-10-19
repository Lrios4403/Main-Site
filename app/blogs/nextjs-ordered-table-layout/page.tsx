import type { Metadata } from "next";
import SiteLayout from "@/components/site-layout/SiteLayout";
import ArticleShell from "@/components/article/ArticleShell";
import { CodeBlock } from "@/components/article/CodeBlock";
import DemoPanel from "@/components/article/DemoPanel";
import Note from "@/components/article/Note";
import ChartFigure from "@/components/article/charts/ChartFigure";
import prose from "@/components/article/Prose.module.css";
import { getPost } from "@/lib/posts";
import { buildPostMetadata } from "@/lib/blog/metadata";
import {
  aboutPageExample,
  aboutPageStylesExample,
  addingAreaExample,
  basicGridTemplateExample,
  contactPageExample,
  contactPageStylesExample,
  globalStylesExample,
  gridStylesExample,
  homePageExample,
  homePageStylesExample,
  movingAreaExample,
  pageViewsExample,
  pageViewsStylesExample,
  rootLayoutExample,
  runProjectExample,
} from "./blob";
import { AddAreaDiagram, HtmlGridDiagram, MoveAreaDiagram, NextGridDiagram, ProjectTree, htmlGridText, nextGridText } from "./diagrams";

// Title, description, dates, tags and the section list live in lib/posts.ts.
// The code examples in blob.ts are the example repository's files, verbatim.
const info = getPost("nextjs-ordered-table-layout");

export const metadata: Metadata = buildPostMetadata(info);

const REPO = "https://github.com/Lrios4403/NextJS-Ordered-Table-Layout";

export default function BlogNextJSOrderedTableLayout() {
  return (
    <SiteLayout variant="detail">
      <ArticleShell post={info}>
        <p>
          While building this site, I kept fighting the Next.js App Router over where things go on the page. I wanted
          each page to bring its own widgets (a views counter here, a table of contents there), but have them land in
          the same spot every time, next to navigation that comes from the layout. The fix turned out to be plain CSS:
          one grid container with named <code>grid-template-areas</code>, and every component placing itself by name,
          from whichever layout or page file renders it.
        </p>
        <Note>
          The full example is on <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>, and you can run
          and edit it in your browser on{" "}
          <a href="https://githubbox.com/Lrios4403/NextJS-Ordered-Table-Layout" target="_blank" rel="noopener noreferrer">CodeSandbox</a>.
        </Note>

        <h2 id="tldr">The short version</h2>
        <ul>
          <li>
            <strong>Name the areas once.</strong> One grid container lists every area in{" "}
            <code>grid-template-areas</code>: header, sidebar, stats, filler, content and footer.
          </li>
          <li>
            <strong>Components place themselves.</strong> Each element adds the class for its area, which sets{" "}
            <code>grid-area</code>, whichever file renders it.
          </li>
          <li>
            <strong>It works across files because Next.js adds no wrappers.</strong> A layout renders its{" "}
            <code>children</code>{" "}as they are, and a page&apos;s fragment adds no element, so a page&apos;s pieces become
            direct children of the layout&apos;s grid.
          </li>
          <li>
            <strong>Code order stops deciding the layout.</strong> The footer can come before the navigation in the code
            and still sit at the bottom. Screen readers and the Tab key still follow the code order, though, so keep it
            sensible.
          </li>
          <li>
            <strong>Rearranging is a CSS change.</strong> Adding an area or moving one to another column changes the
            template, not the components.
          </li>
        </ul>
        <p>
          Part 1 shows the idea in a plain HTML page. Part 2 builds it in Next.js, file by file, and Part 3 adds and
          moves areas. The pitfalls are at the end.
        </p>

        <h2 id="basic-example">Part 1: The idea in plain HTML</h2>
        <p>
          Start with one page and no framework. The grid container has four areas: a header and a footer across the full
          width, and between them a sidebar on the left and the content on the right. Each element says which area it
          belongs in with <code>grid-area</code>, and <code>grid-template-areas</code> draws the map.
        </p>
        <ChartFigure
          title="The plain HTML grid"
          subtitle="Each name in grid-template-areas becomes one area."
          caption="The HTML writes the footer second, before the sidebar and the content; the template still puts it at the bottom."
          text={htmlGridText}
        >
          <HtmlGridDiagram />
        </ChartFigure>
        <p>
          In the code, the footer comes <em>before</em>{" "}the navigation and the main content, and it still renders at the
          bottom. The order of the elements in the HTML doesn&apos;t decide where they appear; the template does.
        </p>
        <DemoPanel title="Open the interactive example">
          <iframe loading="lazy" srcDoc={basicGridTemplateExample} title="Basic grid template example" className={prose.exampleIframe} />
        </DemoPanel>
        <CodeBlock filename="index.html" code={basicGridTemplateExample} language="html" />
        <Note>
          You can also edit this example
          on <a href="https://codesandbox.io/p/sandbox/rfz7jw" target="_blank" rel="noopener noreferrer">CodeSandbox</a>.
        </Note>

        <h2 id="implementing-in-nextjs">Part 2: The same grid in Next.js</h2>
        <p>
          The Next.js version uses the same grid, with React components instead of plain elements, and with the pieces
          spread over several files: the root layout renders what every page shares, and each page renders its own
          content and widgets.
        </p>
        <DemoPanel title="Open the example project" href="https://githubbox.com/Lrios4403/NextJS-Ordered-Table-Layout">
          <iframe loading="lazy" src="https://codesandbox.io/p/sandbox/github/Lrios4403/NextJS-Ordered-Table-Layout?embed=1&file=%2FREADME.md"
            title="The example project on CodeSandbox" className={prose.exampleIframe}
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" />
        </DemoPanel>

        <h3 id="why-it-works">Why it works across files</h3>
        <p>
          Next.js layouts wrap pages through their <code>children</code>{" "}prop, and Next.js doesn&apos;t wrap{" "}
          <code>children</code>{" "}in any extra elements. React fragments don&apos;t add any elements either. So when a page
          returns its pieces in a fragment, they become direct children of whatever element the layout
          renders <code>children</code> into. That is the whole trick: put the grid container in the root layout, and let
          every page drop its pieces straight into it.
        </p>
        <ChartFigure
          title="Who renders each area"
          subtitle="The layout and the pages fill the same grid."
          caption="The page views box comes from each page with its own numbers, and still lands under the layout's navigation on every page."
          text={nextGridText}
        >
          <NextGridDiagram />
        </ChartFigure>
        <p>
          The project adds two areas the HTML example didn&apos;t have, both in the left column: a <code>stats</code>{" "}
          area for a page views counter, and a <code>filler</code>{" "}area that stays empty. The counter is the interesting
          one. The navigation comes from the root layout, but the counter comes from each page, and every page passes in
          its own numbers. Even so, it always lands right under the navigation, in the same spot on every page. A page
          that doesn&apos;t render a counter just leaves the stats area empty, and its row collapses to nothing.
        </p>

        <h3 id="project-structure">The project</h3>
        <p>
          The project is built with Next.js 16 and React 19, and styled with CSS Modules only. These are the files that
          matter:
        </p>
        <ProjectTree />

        <h3 id="the-grid-container">The grid container</h3>
        <p>
          This is the heart of the project. The <code>.grid</code> class is the shared grid container, and its{" "}
          <code>grid-template-areas</code> lay out six named areas. The header and footer span the full width, while the
          sidebar, stats and filler stack up in a 220px column beside the content area.
        </p>
        <p>
          Every area also gets its own class (<code>.header</code>, <code>.sidebar</code>, <code>.stats</code>,{" "}
          <code>.filler</code>, <code>.content</code> and <code>.footer</code>) that sets its <code>grid-area</code>. Any
          component that wants to sit in an area just adds that class, no matter which file it lives in. Below 600px the
          areas stack into a single column and the filler is hidden, since there is no leftover height to fill.
        </p>
        <CodeBlock filename="lib/styles.module.css" code={gridStylesExample} language="css" />

        <h3 id="global-styles">Global styles</h3>
        <p>
          The base styles for the whole site, the same ones from the HTML example: border-box sizing, no margin on the
          body, and the font and background colour.
        </p>
        <CodeBlock filename="app/globals.css" code={globalStylesExample} language="css" />

        <h3 id="the-root-layout">The root layout</h3>
        <p>
          The root layout renders the grid container along with the pieces every page shares: the header, the footer,
          the navigation and the empty filler. Each one gets its area class from <code>lib/styles.module.css</code>. Just
          like the HTML example, the footer is written <em>before</em> the navigation and the page, and the grid still
          puts it at the bottom. Then <code>children</code> is rendered as the last child of the grid container, which is
          where whatever the current page returns ends up.
        </p>
        <p>
          One difference from the HTML example: the grid lives on a wrapper <code>&lt;div&gt;</code> instead of{" "}
          <code>&lt;body&gt;</code>. Next.js adds its own elements to <code>&lt;body&gt;</code>, such as scripts, a hidden{" "}
          <code>&lt;div&gt;</code> and a <code>&lt;next-route-announcer&gt;</code>. If <code>&lt;body&gt;</code> were the
          grid, the route announcer would become an extra grid item and add a row to the layout.
        </p>
        <CodeBlock filename="app/layout.tsx" code={rootLayoutExample} language="tsx" />

        <h3 id="the-home-page">The home page</h3>
        <p>
          The home page returns a fragment with two elements: its <code>&lt;main&gt;</code> content and
          a <code>&lt;PageViews&gt;</code> box. Both become direct children of the grid container.{" "}
          <code>&lt;main&gt;</code> lands in the content area, and the views box lands in the stats area, right under the
          navigation from the layout. The <code>&lt;main&gt;</code> element combines two classes:{" "}
          <code>grid.content</code> places it, and <code>styles.main</code>{" "}from the page&apos;s own CSS module styles it.
        </p>
        <CodeBlock filename="app/page.tsx" code={homePageExample} language="tsx" />
        <p>
          The page&apos;s CSS module only handles how the page looks. Where it goes comes
          from <code>lib/styles.module.css</code>, so a page&apos;s CSS module never has to know about the grid.
        </p>
        <CodeBlock filename="app/page.module.css" code={homePageStylesExample} language="css" />

        <h3 id="the-page-component">The page component</h3>
        <p>
          A page component is any component a page renders that should land in its own grid area instead of the content
          area. This is the kind of widget that started all of this: each page renders it itself, with its own data, but
          it should show up in the same spot on every page.
        </p>
        <p>
          The trick is that the component carries its own area class. It puts the class on its outermost element, so any
          page that renders it gets it placed in that area automatically, and the page doesn&apos;t have to know anything
          about the grid. The same pattern works for any widget: a tags list, a related posts box, or a table of
          contents.
        </p>
        <p>
          The example&apos;s page component is a views box. It takes the page&apos;s <code>today</code> and{" "}
          <code>total</code> view counts as props and shows them alongside the views for the whole site. It adds the{" "}
          <code>grid.stats</code> class to its own <code>&lt;aside&gt;</code>, which puts it in the stats area. The
          numbers are hardcoded examples; a real site would read them from its analytics.
        </p>
        <CodeBlock filename="components/page-views/PageViews.tsx" code={pageViewsExample} language="tsx" />
        <p>
          Its styles lay out each row with flexbox: the label takes the remaining space, and the two numbers sit in
          fixed-width columns on the right.
        </p>
        <CodeBlock filename="components/page-views/styles.module.css" code={pageViewsStylesExample} language="css" />

        <h3 id="the-about-page">The about page</h3>
        <p>
          The about page works the same way as the home page, with its own content and its own view counts. Its content
          lists each element on the page, the grid area it lands in and the file that renders it, which shows that the
          pieces really do come from different files. It also sets its own <code>metadata</code> title. Its styles lay the
          list out as cards that wrap onto new lines as the content area gets narrower.
        </p>
        <CodeBlock filename="app/about/page.tsx" code={aboutPageExample} language="tsx" />
        <CodeBlock filename="app/about/page.module.css" code={aboutPageStylesExample} language="css" />

        <h3 id="the-contact-page">The contact page</h3>
        <p>The simplest page: an email link in the content area, and its own view counts in the stats area.</p>
        <CodeBlock filename="app/contact/page.tsx" code={contactPageExample} language="tsx" />
        <CodeBlock filename="app/contact/page.module.css" code={contactPageStylesExample} language="css" />

        <h2 id="adding-more-to-the-side">Part 3: Adding and moving areas</h2>
        <p>
          Once every element is placed by name, the template is the only thing that decides the layout. Changing it
          rearranges the page without touching a single component.
        </p>

        <h3 id="why-the-filler">Why there&apos;s an empty filler</h3>
        <p>
          The filler is there because of how grid rows work. When the content, or the page&apos;s minimum height
          of <code>100vh</code>, is taller than the navigation and the counter, that extra height has to go to some row.
          Without the filler, the navigation and the counter would stretch to fill it. The filler&apos;s row is the only{" "}
          <code>1fr</code> row in the left column, so it takes all of that extra height, and everything above it keeps its
          natural size. <code>grid-template-rows</code> needs one size per row, which is where that <code>1fr</code> goes.
        </p>

        <h3 id="add-an-area">Adding an area</h3>
        <p>
          Adding another widget to the side takes three small changes in <code>lib/styles.module.css</code>: a new name
          in <code>grid-template-areas</code>, a new size in <code>grid-template-rows</code>, and a class that sets{" "}
          <code>grid-area</code>. After that, any layout or page can render an element with that class. Here is
          a <code>tags</code> area between the counter and the filler:
        </p>
        <ChartFigure title="Adding a tags area" subtitle="One more row in the left column.">
          <AddAreaDiagram />
        </ChartFigure>
        <CodeBlock filename="lib/styles.module.css" code={addingAreaExample} language="css" />

        <h3 id="move-an-area">Moving an area</h3>
        <p>
          Moving things is just as easy. To give the counter its own column on the right side of the page, add a third
          column to the template, and none of the components have to change:
        </p>
        <ChartFigure title="Moving the stats to their own column" subtitle="A third column; the components stay the same.">
          <MoveAreaDiagram />
        </ChartFigure>
        <CodeBlock filename="lib/styles.module.css" code={movingAreaExample} language="css" />

        <h2 id="caveats">Things to watch for</h2>
        <ul>
          <li>
            <strong>Visual order isn&apos;t reading order.</strong> Screen readers and the Tab key follow the order of the
            elements in the code, not where the grid draws them. The example writes the footer before the navigation to
            prove a point; in a real site, keep the code in a sensible reading order and let the grid handle the
            placement.
          </li>
          <li>
            <strong>Only direct children are placed.</strong> If a page wraps its pieces in a <code>&lt;div&gt;</code>{" "}
            instead of a fragment, the whole wrapper becomes one grid item, and the pieces inside it ignore their area
            classes.
          </li>
          <li>
            <strong>A misspelled area doesn&apos;t fail loudly.</strong>{" "}If an element names an area that isn&apos;t in{" "}
            <code>grid-template-areas</code>, the browser doesn&apos;t report an error; it places the element in an extra
            row or column outside the template.
          </li>
          <li>
            <strong>Plan the small screen.</strong> The example switches to a one-column template below 600px. Whatever
            you add to the wide template needs a place in the narrow one too.
          </li>
        </ul>

        <h2 id="running-the-project">Run it yourself</h2>
        <p>
          Clone the repository, install the dependencies and start the dev server, then
          open <code>http://localhost:3000</code>.
        </p>
        <CodeBlock kind="command" code={runProjectExample} language="bash" />

        <h2 id="glossary">Terms used in this post</h2>
        <dl>
          <dt><strong><code>grid-template-areas</code></strong></dt>
          <dd>A CSS property that draws the grid as text: one quoted string per row, one name per cell. Repeating a name makes that area span several cells.</dd>
          <dt><strong><code>grid-area</code></strong></dt>
          <dd>Puts an element in one of those named areas.</dd>
          <dt><strong>Root layout</strong></dt>
          <dd>The <code>app/layout.tsx</code> file. It renders the <code>&lt;html&gt;</code> and <code>&lt;body&gt;</code> that every page shares, with the current page passed in as <code>children</code>.</dd>
          <dt><strong>Fragment</strong></dt>
          <dd><code>&lt;&gt;...&lt;/&gt;</code> in React: groups elements without adding one of its own to the page.</dd>
          <dt><strong>CSS Module</strong></dt>
          <dd>A <code>.module.css</code> file whose class names are scoped to the component that imports them.</dd>
          <dt><strong><code>fr</code></strong></dt>
          <dd>A grid unit for a share of the leftover space. A single <code>1fr</code> row takes all of it.</dd>
        </dl>

        <h2 id="update-notes">Updates</h2>
        <p>
          <time dateTime="2026-10-19">October 19, 2026</time>: restructured the post into three parts, drew the grids as
          diagrams, added the section on things to watch for, and checked every code example against the example
          repository (they match it exactly).
        </p>
        <p><time dateTime="2026-10-10">October 10, 2026</time>: moved onto the site&apos;s shared article layout.</p>
        <p><time dateTime="2026-10-06">October 6, 2026</time>: first published.</p>
      </ArticleShell>
    </SiteLayout>
  );
}
