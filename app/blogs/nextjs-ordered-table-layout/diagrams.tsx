import FileTree from "@/components/article/FileTree";
import GridAreasDiagram from "@/components/article/charts/GridAreasDiagram";

// The post's grids, drawn from the same grid-template-areas the CSS uses,
// and the example project's files.

export function ProjectTree() {
  return (
    <FileTree
      title="Project structure"
      legend={{ layout: "renders the shared areas", page: "renders its own areas" }}
      nodes={[
        { name: "lib", children: [
          { name: "styles.module.css", href: "#the-grid-container", note: "the grid container and one class per named area" },
        ] },
        { name: "components", children: [
          { name: "page-views", children: [
            { name: "PageViews.tsx", href: "#the-page-component", tone: "page", note: "the views box each page places in the stats area" },
            { name: "styles.module.css", href: "#the-page-component", note: "how the views box looks" },
          ] },
        ] },
        { name: "app", children: [
          { name: "globals.css", href: "#global-styles", note: "base styles for the whole site" },
          { name: "layout.tsx", href: "#the-root-layout", tone: "layout", note: "the grid container, header, footer, navigation and filler" },
          { name: "page.tsx", href: "#the-home-page", tone: "page", note: "the home page's content and page views" },
          { name: "page.module.css", href: "#the-home-page", note: "how the home page's content looks" },
          { name: "about", children: [
            { name: "page.tsx", href: "#the-about-page", tone: "page", note: "the about page's content and page views" },
            { name: "page.module.css", href: "#the-about-page", note: "how the about page's content looks" },
          ] },
          { name: "contact", children: [
            { name: "page.tsx", href: "#the-contact-page", tone: "page", note: "the contact page's content and page views" },
            { name: "page.module.css", href: "#the-contact-page", note: "how the contact page's content looks" },
          ] },
        ] },
      ]}
    />
  );
}

export function HtmlGridDiagram() {
  return (
    <GridAreasDiagram
      id="grid-html"
      title="The plain HTML grid: header across the top, the sidebar and the content side by side, the footer across the bottom. In the HTML the footer is written second, before the sidebar and the content."
      template={[["header", "header"], ["sidebar", "content"], ["footer", "footer"]]}
      cols={[1, 2.2]}
      rows={[44, 110, 44]}
      areas={{
        header: { label: "header", sub: "written 1st", tone: "layout" },
        sidebar: { label: "sidebar", sub: "written 3rd", tone: "layout" },
        content: { label: "content", sub: "written 4th", tone: "layout" },
        footer: { label: "footer", sub: "written 2nd", tone: "layout" },
      }}
    />
  );
}

export const htmlGridText = (
  <ul>
    <li>The template has three rows: the header across both columns, then the sidebar and the content side by side, then the footer across both columns.</li>
    <li>The HTML writes them in a different order: header, footer, sidebar, content. The grid still draws the footer at the bottom.</li>
  </ul>
);

export function NextGridDiagram() {
  return (
    <GridAreasDiagram
      id="grid-next"
      title="The Next.js project's grid: the root layout renders the header, the navigation, the empty filler and the footer; each page renders its main content and its page views box, which land in the content and stats areas."
      template={[["header", "header"], ["sidebar", "content"], ["stats", "content"], ["filler", "content"], ["footer", "footer"]]}
      cols={[1, 2.2]}
      rows={[40, 54, 54, 66, 40]}
      legend={{ layout: "app/layout.tsx", page: "each page" }}
      areas={{
        header: { label: "header", sub: "<header>", tone: "layout" },
        sidebar: { label: "sidebar", sub: "<nav>", tone: "layout" },
        stats: { label: "stats", sub: "<PageViews>", tone: "page" },
        filler: { label: "filler", sub: "empty <div>", tone: "layout" },
        content: { label: "content", sub: "<main>", tone: "page" },
        footer: { label: "footer", sub: "<footer>", tone: "layout" },
      }}
    />
  );
}

export const nextGridText = (
  <ul>
    <li>The root layout (<code>app/layout.tsx</code>) renders the header, the navigation in the sidebar area, the empty filler and the footer.</li>
    <li>Each page renders a <code>&lt;main&gt;</code> for the content area and a <code>&lt;PageViews&gt;</code> box for the stats area, right under the navigation.</li>
    <li>The filler is the only flexible row in the left column, so it takes the leftover height.</li>
  </ul>
);

export function AddAreaDiagram() {
  return (
    <GridAreasDiagram
      id="grid-add"
      title="Adding a tags area: a new row named tags between the stats and the filler, beside the content."
      template={[["header", "header"], ["sidebar", "content"], ["stats", "content"], ["tags", "content"], ["filler", "content"], ["footer", "footer"]]}
      cols={[1, 2.2]}
      rows={[30, 34, 34, 34, 40, 30]}
      areas={{
        header: { label: "header", tone: "layout" },
        sidebar: { label: "sidebar", tone: "layout" },
        stats: { label: "stats", tone: "layout" },
        tags: { label: "tags (new)", tone: "new" },
        filler: { label: "filler", tone: "layout" },
        content: { label: "content", tone: "layout" },
        footer: { label: "footer", tone: "layout" },
      }}
    />
  );
}

export function MoveAreaDiagram() {
  return (
    <GridAreasDiagram
      id="grid-move"
      title="Moving the stats to their own column: a third column on the right, where the stats sit beside the content."
      template={[["header", "header", "header"], ["sidebar", "content", "stats"], ["filler", "content", "stats"], ["footer", "footer", "footer"]]}
      cols={[1, 1.8, 1]}
      rows={[30, 40, 60, 30]}
      areas={{
        header: { label: "header", tone: "layout" },
        sidebar: { label: "sidebar", tone: "layout" },
        content: { label: "content", tone: "layout" },
        stats: { label: "stats", sub: "moved here", tone: "new" },
        filler: { label: "filler", tone: "layout" },
        footer: { label: "footer", tone: "layout" },
      }}
    />
  );
}
