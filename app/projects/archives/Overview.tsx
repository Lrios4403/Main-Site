import { CodeBlock } from "@/components/article/CodeBlock";
import DemoPanel from "@/components/article/DemoPanel";
import ChartFigure from "@/components/article/charts/ChartFigure";
import { PipelineDiagram, pipelineText } from "./diagrams";
import { ARCHIVE, Ext } from "./links";

// The introduction, the short version and Part 1: what a WARC holds and how
// the pieces fit together.
export function Overview() {
  return <>
    <p>
      M4cgyvers Archives is my one-person, unfunded web archive. I crawl small, old and at-risk sites (forums,
      personal homepages, Neocities pages and the like) and keep them as WARC files, the same format the Internet
      Archive uses. As of October 2026 that&apos;s about 2,180 files, more than 21 million captured responses and
      about 4.9 TB (4.4 TiB) on disk. You can search it by URL, see when a page was captured, and browse any capture the way it
      looked back then, or open your own WARC files in an offline viewer that never uploads them.
    </p>
    <p>
      This page is how it works: how terabytes of captures get indexed without being copied, how a capture gets put
      back together, how a server on my home network is reachable without opening a port, and how the same parser
      ends up running in your browser.
    </p>
    <p>
      Try it: <Ext href={`${ARCHIVE}/warcs`}>search the archive</Ext>, or open a WARC file in
      the <Ext href={`${ARCHIVE}/warcs/offline`}>offline viewer</Ext>.
    </p>
    <DemoPanel title="Preview the live archive" href={ARCHIVE}>
      <iframe src={ARCHIVE} title="Live archive preview" loading="lazy" style={{ aspectRatio: "16 / 9" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals" />
    </DemoPanel>

    <h2 id="tldr">The short version</h2>
    <ul>
      <li>
        <strong>The archive is just the WARC files.</strong> Every crawl is kept byte for byte as the site served it,
        mistakes included. Nothing is cleaned up; a compressed archive is only unpacked to a plain{" "}
        <code>.warc</code>.
      </li>
      <li>
        <strong>The database is an index, not a copy.</strong>{" "}For each captured response, PostgreSQL stores which
        file it&apos;s in and where. Opening a capture reads exactly those bytes, so the index stays a fraction of the
        archive&apos;s size.
      </li>
      <li>
        <strong>One small parser does all the reading.</strong>{" "}It&apos;s hand-written, has no dependencies and never
        touches the disk itself, so the same file indexes the archive on the server and runs in your browser. Most of
        it exists because some real WARC broke an earlier version.
      </li>
      <li>
        <strong>It runs at home, behind a tunnel.</strong> The backend sits on my home network, and a WireGuard tunnel
        to a rented VPS carries the traffic, so no ports are open on my router.
      </li>
      <li>
        <strong>Replay is a reconstruction, not a time machine.</strong>{" "}Links and images point at the captures nearest
        in time. Script-heavy pages can still break online, and so can links whose http/https or www. doesn&apos;t
        match the capture; the offline viewer handles scripts and revisit records much better.
      </li>
    </ul>
    <p>
      Part 1 is what a WARC holds and how the pieces fit. Part 2 is the indexing: the database, the parser and how a
      long parse resumes. Part 3 is search, replay and downloads, Part 4 is how a server at home gets online, and Part
      5 is the offline viewer. The limits are at the end.
    </p>

    <h2 id="how-it-fits">Part 1: WARC files, and how the pieces fit</h2>
    <p>Everything starts with a crawl, and everything after it is reading what the crawl saved.</p>

    <h3 id="collecting-warcs">A WARC is the raw HTTP traffic, kept as-is</h3>
    <p>
      I crawl sites with <code>wget --warc-file</code>, which saves every request and response it makes into a WARC
      file. A WARC is a long list of records. Each record has its own WARC headers, and a response record holds the
      raw HTTP response exactly as the server sent it, headers and all:
    </p>
    <CodeBlock kind="output" label="WARC record" code={`WARC/1.1
WARC-Type: response
WARC-Target-URI: http://example.com/
WARC-Date: 2009-06-14T03:21:07Z
WARC-Record-ID: <urn:uuid:...>
Content-Type: application/http; msgtype=response
Content-Length: 1270

HTTP/1.1 200 OK
Content-Type: text/html

<html> ...the page, byte for byte... </html>`} />
    <p>
      Because the bytes are untouched, a WARC is a faithful record of what the site actually served, including its
      mistakes. That last part matters a lot for <a href="#real-world-warcs">the parser</a>.
    </p>
    <p>
      Two variants come up later. In a <code>.warc.gz</code>, each record is compressed as its own gzip member, so
      any one record can be read without inflating the rest. A <code>.wacz</code> is a zip of <code>.warc.gz</code>{" "}
      files. And some records are revisits: a capture that says &quot;same as before&quot; and points at an earlier
      response instead of storing the bytes again.
    </p>

    <h3 id="the-big-picture">From a crawl to your browser</h3>
    <p>
      The archive is split in two. The heavy half (the WARC files, the database, the parser and the API) lives on my
      home network, with everything but the WARC files running in Docker on a Linux machine. The website runs on a
      rented VPS. A WireGuard tunnel joins them.
    </p>
    <ChartFigure
      title="From crawl to browser"
      subtitle="The home network holds the data; the VPS serves the website."
      caption="The offline viewer runs the same parser as the home machine, in Web Workers in your browser, on your own files."
      text={pipelineText}
    >
      <PipelineDiagram />
    </ChartFigure>
    <p>
      The key idea is that the database never stores the archived pages, only <em>where</em> each response sits inside
      its WARC. When you open a capture, the API reads exactly those bytes off disk. Part 2 is about that.
    </p>
  </>;
}
