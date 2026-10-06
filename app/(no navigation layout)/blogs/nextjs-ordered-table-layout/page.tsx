import PageHeader from "@/components/page-header/PageHeader";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import post from "./page.module.css";

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'

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
  layoutComparison,
  movingAreaExample,
  pageViewsExample,
  pageViewsStylesExample,
  projectStructure,
  rootLayoutExample,
  runProjectExample,
} from "./blob";
import { CodeBlock } from "./codeblock";

export default function BlogNextJSOrderedTableLayout() {
  return (
    <>
      <PageHeader title="NextJS Ordered Table Layout">
        This method uses CSS grid areas to arrange components across layouts and
        pages in the Next.js App Router.
      </PageHeader>

      {/* Left-hand navigation: in-page table of contents */}
      <div className={`${styles.navLhs} ${post.toc}`}>
        <Window title="Navigation" bodyStyle={{ padding: 8, paddingLeft: 12 }}>
          <ul className={styles.list}>
            <li>
              <a href="#abstract">Abstract</a>
            </li>
            <li>
              <a href="#basic-example">Basic Example</a>
            </li>
            <li>
              <a href="#implementing-in-nextjs">Implementing in Next.js</a>
              <ul className={styles.list}>
                <li>
                  <a href="#adding-more-to-the-side">Adding More to the Side</a>
                </li>
                <li>
                  <a href="#the-grid-container">The Grid Container</a>
                </li>
                <li>
                  <a href="#the-root-layout">The Root Layout</a>
                </li>
                <li>
                  <a href="#the-page-component">The Page Component</a>
                </li>
                <li>
                  <a href="#running-the-project">Running the Project</a>
                </li>
              </ul>
            </li>
          </ul>
        </Window>
      </div>

      <Window
        title="Setup"
        className={`${styles.contentArea} ${post.post}`}
      >
        <h1 id="abstract">Abstract</h1>
        <p>
          While working on my website, I had trouble keeping my components in the
          correct order and alignment while using the Next.js App Router. For
          example, I wanted different pages to have different navigation widgets,
          but I wanted those widgets to appear in consistent positions.
        </p>
        <p>
          I also wanted to reuse components across layouts and pages. My solution
          was to define <code>grid-template-areas</code> on a shared grid container
          and assign components to those areas using <code>grid-area</code>.
          Components can be defined in different layout or page files, provided
          their rendered elements are direct children of that grid container.
        </p>
        <p>
          This approach worked well for my website, so I thought I would share it
          for anyone dealing with a similar layout problem.
        </p>

        <h1 id="basic-example">Basic Example</h1>
        <span className={post.notification}>If you want to try and play around with this example, go ahead and go to <a href="https://codesandbox.io/p/sandbox/rfz7jw" target="_blank" rel="noopener noreferrer">CodeSandbox Example</a>.</span>
        <p>
          Let&apos;s start with a basic example in a plain HTML page. Then,
          we&apos;ll adapt it to a Next.js project. This is pretty basic, we have a grid container with three areas: header, main, and footer. The header and footer are full width, while the main content is centered. The main content is divided into two columns: a sidebar and a main content area. The sidebar is on the left, and the main content area is on the right.
        </p>
        <p>In the code however, we can see that the footer is <em>above</em> the navigation and the main content area. with <code>grid-template-areas</code>. Proving we dont need to worry about the order of the elements in the HTML since they will be rendered in the order specified by the grid template in the css.</p>

        <div>
          <iframe srcDoc={basicGridTemplateExample} title="Basic Grid Template Example" className={post.exampleIframe} />
          <CodeBlock code={basicGridTemplateExample} language="html" className={post.codeBlock} />
        </div>

        
        <h1 id="implementing-in-nextjs">Implementing in Next.js</h1>
        <span className={post.notification}>The project can be found at <a href="https://github.com/Lrios4403/NextJS-Ordered-Table-Layout" target="_blank" rel="noopener noreferrer">Github!</a> Or if you would like to play around with a live demo and make your own modifications go ahead and try out the demo at <a href="https://githubbox.com/Lrios4403/NextJS-Ordered-Table-Layout" target="_blank" rel="noopener noreferrer">CodeSandbox!</a> (which is shown below)</span>
        <div>
           <iframe src="https://codesandbox.io/p/sandbox/github/Lrios4403/NextJS-Ordered-Table-Layout?embed=1&file=%2FREADME.md" 
              style={{ width: "100%", aspectRatio: "4/3", border: "0", borderRadius: "4px", overflow: "hidden" }}
              title="example-grid"
              allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            ></iframe>

        </div>
        <p>Now, our project will have a similar structure, but we will use React components instead of plain HTML elements. Our structure of our projects is roughly going to be:</p>
        <pre>{projectStructure.trim()}</pre>
        <p>
          Next.js layouts wrap pages through their <code>children</code> prop,
          and Next.js doesn&apos;t wrap <code>children</code> in any extra
          elements. React fragments don&apos;t add any elements either. So when a
          page returns its pieces in a fragment, they become direct children of
          whatever element the layout renders <code>children</code> into. That
          is the whole trick: put the grid container in the root layout, and let
          every page drop its pieces straight into it.
        </p>

        <h2 id="adding-more-to-the-side">Adding More to the Side</h2>
        <p>
          The Next.js project isn&apos;t a one-to-one copy of the HTML example.
          The HTML example only had four areas: the header, the sidebar, the
          content and the footer. This project adds two more to the left column:
          a <code>stats</code> area with a page views counter, and a{" "}
          <code>filler</code> area that stays empty. They are there to show that
          the side isn&apos;t limited to the navigation, and that we can keep
          adding pieces to it from any file.
        </p>
        <pre>{layoutComparison.trim()}</pre>
        <p>
          The page views counter is the interesting one. The navigation comes
          from the root layout, but the counter comes from each page, and every
          page passes in its own numbers. Even so, it always lands right under
          the navigation, in the same spot on every page. That is exactly the
          problem from the abstract: different pages with different widgets, all
          lining up in consistent positions. A page that doesn&apos;t render a
          counter just leaves the stats area empty, and its row collapses to
          nothing.
        </p>
        <p>
          The filler is there because of how grid rows work. When the content,
          or the page&apos;s minimum height of <code>100vh</code>, is taller than
          the navigation and the counter, that extra height has to go to some
          row. Without the filler, the navigation and the counter would stretch
          to fill it. The filler&apos;s row is the only <code>1fr</code> row, so
          it takes all of that extra height, and everything above it keeps its
          natural size.
        </p>
        <p>
          Adding another widget to the side takes three small changes in{" "}
          <code>lib/styles.module.css</code>: a new name in{" "}
          <code>grid-template-areas</code>, a new size in{" "}
          <code>grid-template-rows</code>, and a class that sets{" "}
          <code>grid-area</code>. After that, any layout or page can render an
          element with that class. For example, here is a <code>tags</code> area
          added between the counter and the filler:
        </p>
        <CodeBlock code={addingAreaExample} language="css" />
        <p>
          Moving things around is just as easy. Since every element is placed by
          name, <code>grid-template-areas</code> is the only thing that decides
          where it goes. To give the counter its own column on the right side of
          the page, add a third column to the template, and none of the
          components have to change:
        </p>
        <CodeBlock code={movingAreaExample} language="css" />

        <h2 id="the-grid-container">The Grid Container</h2>
        <h3>lib/styles.module.css</h3>
        <p>
          This is the heart of the project. The <code>.grid</code> class is the
          shared grid container, and its <code>grid-template-areas</code> lay out
          six named areas. The header and footer span the full width, while the
          sidebar, stats and filler stack up in a 220px column beside the content
          area.
        </p>
        <p>
          Every area also gets its own class (<code>.header</code>,{" "}
          <code>.sidebar</code>, <code>.stats</code>, <code>.filler</code>,{" "}
          <code>.content</code> and <code>.footer</code>) that sets its{" "}
          <code>grid-area</code>. Any component that wants to sit in an area just
          adds that class, no matter which file it lives in.
        </p>
        <p>
          <code>grid-template-rows</code> needs one size per row. The filler row
          is the only <code>1fr</code> row in the left column, so it soaks up the
          leftover height, and the navigation and stats keep their natural size
          instead of stretching to match the content. Below 600px, the areas
          stack into a single column and the filler is hidden, since there is no
          leftover height to fill.
        </p>
        <CodeBlock code={gridStylesExample} language="css" />

        <h2 id="global-styles">Global Styles</h2>
        <h3>app/globals.css</h3>
        <p>
          The base styles for the whole site, the same ones from the HTML
          example: border-box sizing, no margin on the body, and the font and
          background color.
        </p>
        <CodeBlock code={globalStylesExample} language="css" />

        <h2 id="the-root-layout">The Root Layout</h2>
        <h3>app/layout.tsx</h3>
        <p>
          The root layout renders the grid container along with the pieces every
          page shares: the header, the footer, the navigation and the empty
          filler. Each one gets its area class from{" "}
          <code>lib/styles.module.css</code>.
        </p>
        <p>
          Just like the HTML example, the footer is written <em>before</em> the
          navigation and the page, and the grid still puts it at the bottom.
          Then <code>children</code> is rendered as the last child of the grid
          container, which is where whatever the current page returns ends up.
        </p>
        <p>
          One difference from the HTML example is that the grid lives on a
          wrapper <code>&lt;div&gt;</code> instead of <code>&lt;body&gt;</code>.
          Next.js adds its own elements to <code>&lt;body&gt;</code>, such as
          scripts, a hidden <code>&lt;div&gt;</code> and a{" "}
          <code>&lt;next-route-announcer&gt;</code>. If <code>&lt;body&gt;</code>{" "}
          were the grid, the route announcer would become an extra grid item and
          add a row to the layout.
        </p>
        <CodeBlock code={rootLayoutExample} language="tsx" />

        <h2 id="the-home-page">The Home Page</h2>
        <h3>app/page.tsx</h3>
        <p>
          The home page returns a fragment with two elements: its{" "}
          <code>&lt;main&gt;</code> content and a <code>&lt;PageViews&gt;</code>{" "}
          box. Both become direct children of the grid container.{" "}
          <code>&lt;main&gt;</code> lands in the content area, and the views box
          lands in the stats area, right under the navigation from the layout.
        </p>
        <p>
          The <code>&lt;main&gt;</code> element combines two classes:{" "}
          <code>grid.content</code> places it, and <code>styles.main</code> from
          the page&apos;s own CSS module styles it.
        </p>
        <CodeBlock code={homePageExample} language="tsx" />

        <h3>app/page.module.css</h3>
        <p>
          This file only handles how the home page looks. Where it goes comes
          from <code>lib/styles.module.css</code>, so a page&apos;s CSS module
          never has to know about the grid.
        </p>
        <CodeBlock code={homePageStylesExample} language="css" />

        <h2 id="the-page-component">The Page Component</h2>
        <p>
          A page component is any component a page renders that should land in
          its own grid area instead of the content area. This is the kind of
          widget that started all of this: each page renders it itself, with its
          own data, but it should show up in the same spot on every page.
        </p>
        <p>
          The trick is that the component carries its own area class. It puts
          the class on its outermost element, so any page that renders it gets
          it placed in that area automatically, and the page doesn&apos;t have
          to know anything about the grid. The same pattern works for any
          widget: a tags list, a related posts box, or a table of contents.
        </p>
        <h3>components/page-views/PageViews.tsx</h3>
        <p>
          The example project&apos;s page component is a views box. It takes the
          page&apos;s <code>today</code> and <code>total</code> view counts as
          props, and shows them alongside the views for the whole site. It adds
          the <code>grid.stats</code> class to its own{" "}
          <code>&lt;aside&gt;</code>, which puts it in the stats area. The
          numbers are hardcoded examples. A real site would read them from its
          analytics.
        </p>
        <CodeBlock code={pageViewsExample} language="tsx" />

        <h3>components/page-views/styles.module.css</h3>
        <p>
          Lays out each row of the views box with flexbox. The label takes up the
          remaining space, and the two numbers sit in fixed-width columns on the
          right.
        </p>
        <CodeBlock code={pageViewsStylesExample} language="css" />

        <h2 id="the-about-page">The About Page</h2>
        <h3>app/about/page.tsx</h3>
        <p>
          The about page works the same way as the home page, with its own
          content and its own view counts. Its content lists each element on the
          page, the grid area it lands in and the file that renders it, which
          shows that the pieces really do come from different files. It also
          sets its own <code>metadata</code> title.
        </p>
        <CodeBlock code={aboutPageExample} language="tsx" />

        <h3>app/about/page.module.css</h3>
        <p>
          Lays out the list of areas as cards with flexbox. The cards wrap onto
          new lines as the content area gets narrower.
        </p>
        <CodeBlock code={aboutPageStylesExample} language="css" />

        <h2 id="the-contact-page">The Contact Page</h2>
        <h3>app/contact/page.tsx</h3>
        <p>
          The simplest page: an email link in the content area, and its own view
          counts in the stats area.
        </p>
        <CodeBlock code={contactPageExample} language="tsx" />

        <h3>app/contact/page.module.css</h3>
        <p>Styles the email link.</p>
        <CodeBlock code={contactPageStylesExample} language="css" />

        <h2 id="running-the-project">Running the Project</h2>
        <p>
          The project is built with Next.js 16 and React 19, and is styled with
          CSS Modules only. To try it yourself, clone the repository, install the
          dependencies and start the dev server, then open{" "}
          <code>http://localhost:3000</code>.
        </p>
        <CodeBlock code={runProjectExample} language="bash" />
      </Window>
    </>
  );
}