import Note from "@/components/article/Note";
import ChartFigure from "@/components/article/charts/ChartFigure";
import { SegmentsDiagram, segmentsText } from "./diagrams";
import { ARCHIVE, Ext } from "./links";

// Part 5: the same parser in the browser, on the reader's own files.
export function OfflineViewer() {
  return <>
    <h2 id="offline-viewer">Part 5: The offline viewer runs the same parser in your browser</h2>
    <p>
      The offline viewer opens your own <code>.warc</code>, <code>.warc.gz</code> and <code>.wacz</code>{" "}files and
      rebuilds their pages entirely in your browser. Nothing from your files is uploaded. It&apos;s a one-person
      project with no accounts and no users to sell, so there&apos;s no reason for your files to touch my server.
    </p>

    <h3 id="browser-parsing">Using every core on one big file</h3>
    <p>
      The backend bundles <a href="#parser">the same parser</a> it uses for indexing into a single script for Web
      Workers (built when the server starts, about 24 KB gzipped, and cached), and the viewer starts a pool of workers
      from it.
    </p>
    <ChartFigure
      title="Splitting one file across workers"
      subtitle="A plain WARC of 128 MB or more, parsed by a pool of Web Workers."
      caption="Each worker sends back only headers and byte locations, never bodies."
      text={segmentsText}
    >
      <SegmentsDiagram />
    </ChartFigure>
    <p>
      A big plain <code>.warc</code> is cut into segments of at least 64 MB, one per worker. Each segment owns the
      records that start inside it, so neighbouring workers never have to coordinate. When a worker runs out of work,
      it takes half of what the busiest worker has left, and that worker answers with the exact record where it
      stopped, so nothing is skipped or parsed twice.
    </p>
    <ul>
      <li>
        <strong>A <code>.warc.gz</code>{" "}is indexed while it&apos;s read.</strong>{" "}Each record is its own gzip member, so
        the parser inflates the file once and notes where every member starts. Viewing a page later only inflates that
        one member, with the browser&apos;s built-in decompression where it&apos;s available. If an archive was gzipped
        as one stream instead of per record, the viewer warns you, because then every page view has to re-inflate the
        whole file.
      </li>
      <li>
        <strong>A <code>.wacz</code> needs no extraction.</strong> Tools like Browsertrix store the{" "}
        <code>.warc.gz</code> files inside a WACZ uncompressed, so each one is just a slice of the file you picked, and
        the viewer hands each slice to its own worker without copying anything.
      </li>
    </ul>
    <p>
      The page keeps the index in memory and builds a tree of every captured URL, grouped by site, along with each
      URL&apos;s capture timeline.
    </p>

    <h3 id="rebuilding-pages">Rebuilding a page from your files</h3>
    <p>When you open a page, a dedicated view worker rebuilds it:</p>
    <ol>
      <li>
        <p>
          It reads the response body straight from your local file, inflating its gzip member, removing chunked framing
          and undoing gzip or deflate compression the original server applied.
        </p>
      </li>
      <li>
        <p>
          It rewrites the HTML, CSS and JavaScript. For every URL in the page, it asks for the capture{" "}
          <a href="#nearest-capture">nearest in time</a>{" "}to the page you&apos;re viewing, following up to 5 redirects
          and resolving revisit records to the bytes they point at, even when those bytes sit in another archive of the
          same WACZ.
        </p>
      </li>
      <li>
        <p>
          Each resource it finds becomes a <code>blob:</code> URL (an in-memory URL for data the page already holds),
          built recursively for stylesheets that pull in images and fonts. Anything missing points at a blank page or an
          empty file, never at the live site, so nothing present-day ever passes itself off as archived.
        </p>
      </li>
      <li>
        <p>
          The finished page loads in a frame. An injected script catches clicks, form submits, script
          navigations, <code>fetch</code> and <code>XMLHttpRequest</code>, and answers them from your files.
        </p>
      </li>
      <li>
        <p>Your browser&apos;s Back and Forward buttons move through the pages you&apos;ve visited in the viewer.</p>
      </li>
    </ol>
    <p>
      A service worker caches the viewer and its parser, so once you&apos;ve opened it, it can start again without a
      connection. Zip downloads work here too: Chromium writes them straight to disk, while Firefox and Safari build
      them in memory first.
    </p>
    <Note>
      Try it at <Ext href={`${ARCHIVE}/warcs/offline`}>archives.m4cgyver.net/warcs/offline</Ext>. If you&apos;d
      rather use other tools, the archive&apos;s{" "}
      <Ext href={`${ARCHIVE}/guides/how-to-open-warc-file`}>guide to opening WARC files</Ext> covers several.
    </Note>
  </>;
}
