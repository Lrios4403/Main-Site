import type { Metadata } from "next";
import PageHeader from "@/components/page-header/PageHeader";
import styles from "@/components/main/styles.module.css";
import Window from "@/components/window/Window";
import post from "./page.module.css";

export const metadata: Metadata = {
  title: "M4cgyvers Archives",
  description:
    "How archives.m4cgyver.net works: a one-person web archive that indexes WARC files with Bun and PostgreSQL, serves them through a WireGuard tunnel, and replays them online or right in your browser.",
};

const SITE = "https://archives.m4cgyver.net";

export default function ProjectArchives() {
  return (
    <>
      <PageHeader title="M4cgyvers Archives">
        How archives.m4cgyver.net works: a one-person web archive that indexes
        WARC files with Bun and PostgreSQL, serves them through a WireGuard
        tunnel, and replays them online or right in your browser.
      </PageHeader>

      {/* Left-hand navigation: in-page table of contents */}
      <div className={`${styles.navLhs} ${post.toc}`}>
        <Window title="Navigation" bodyStyle={{ padding: 8, paddingLeft: 12 }}> 
          <ul className={styles.list}>
            <li>
              <a href="#what-it-is">What It Is</a>
            </li>
            <li>
              <a href="#the-big-picture">The Big Picture</a>
            </li>
            <li>
              <a href="#collecting-warcs">Collecting WARCs</a>
            </li>
            <li>
              <a href="#backend">Backend Stack</a>
              <ul className={styles.list}>
                <li>
                  <a href="#bun-api">The Bun API</a>
                </li>
                <li>
                  <a href="#postgresql">PostgreSQL</a>
                </li>
                <li>
                  <a href="#wireguard">The WireGuard Tunnel</a>
                </li>
              </ul>
            </li>
            <li>
              <a href="#frontend">Frontend</a>
            </li>
            <li>
              <a href="#parser">The Parser</a>
            </li>
            <li>
              <a href="#online-replay">Replaying Online</a>
            </li>
            <li>
              <a href="#offline-viewer">The Offline Viewer</a>
            </li>
            <li>
              <a href="#downloads">Downloads</a>
            </li>
            <li>
              <a href="#limits">Limits</a>
            </li>
          </ul>
        </Window>
      </div>

      <Window
        title="Archives"
        className={`${styles.contentArea} ${post.post}`}
      >
        <div>
          <a href={SITE} target="_blank" rel="noopener noreferrer">https://archives.m4cgyver.net</a> is the live archive.
          <iframe src="https://archives.m4cgyver.net/" className={post.tocFrame} style={{width: '100%', aspectRatio: '16 / 9'}}/>
          <br/>
        </div>

        <h1 id="what-it-is">What It Is</h1>
        <span className={post.notification}>
          The archive lives at{" "}
          <a href={SITE} target="_blank" rel="noopener noreferrer">
            archives.m4cgyver.net
          </a>
          . You can{" "}
          <a href={`${SITE}/warcs`} target="_blank" rel="noopener noreferrer">
            search the collection
          </a>{" "}
          or open your own WARC files in the{" "}
          <a href={`${SITE}/warcs/offline`} target="_blank" rel="noopener noreferrer">
            offline viewer
          </a>
          .
        </span>
        <p>
          M4cgyvers Archives is my one-person, unfunded web archive. I crawl
          small, old and at-risk sites (forums, personal homepages, Neocities
          pages and the like) and keep them as WARC files, the same format the
          Internet Archive uses. As of September 2026 it holds over 1,700 WARC
          files, more than 11 million captured responses and about 2 TB on
          disk.
        </p>
        <p>The site has two public tools:</p>
        <ul>
          <li>
            <strong>Search and replay</strong>
            <p>
              Search the collection by URL or hostname, see when each page was
              captured on a timeline, and open any capture to browse it the way
              it looked back then.
            </p>
          </li>
          <li>
            <strong>The offline viewer</strong>
            <p>
              Open your own <code>.warc</code>, <code>.warc.gz</code> or{" "}
              <code>.wacz</code> files and browse them in your browser. The
              files are parsed on your machine and never uploaded.
            </p>
          </li>
        </ul>
        <p>
          This page goes over how it all fits together: the backend stack, the
          frontend, the parser that reads WARC files, and how the offline
          viewer rebuilds pages without a server.
        </p>

        <h1 id="the-big-picture">The Big Picture</h1>
        <p>
          The archive is split across two machines. The heavy half (the WARC
          files, the database, the parser and the API) runs in Docker on a
          Linux machine at home. The website runs on a rented VPS. A WireGuard
          tunnel joins them.
        </p>
        <pre>{`  wget --warc-file           (crawl a site)
          |
          v
     WARC files on disk  <----------------------+
          |                                     |
          v                                     |
     Bun parser          (worker threads)       |
          |                                     |
          | where every response lives          |
          v                                     |
     PostgreSQL 18       (the index)            |
          |                                     |
          v                                     |
     Bun API  ---- reads byte ranges -----------+
          |
          |  WireGuard tunnel
          v
  VPS:  nginx  --->  Next.js frontend
          |
          v
     Your browser
     (the offline viewer runs the same parser, in Web Workers)`}</pre>
        <p>
          The key idea is that the database never stores the archived pages.
          It stores <em>where</em> each response sits inside its WARC file.
          When you open a capture, the API reads exactly those bytes off disk.
        </p>

        <h1 id="collecting-warcs">Collecting WARCs</h1>
        <p>
          I crawl sites with <code>wget --warc-file</code>, which saves every
          request and response it makes into a WARC file. A WARC is a long
          list of records. Each record has its own WARC headers, and a response
          record holds the raw HTTP response exactly as the server sent it,
          headers and all:
        </p>
        <pre>{`WARC/1.1
WARC-Type: response
WARC-Target-URI: http://example.com/
WARC-Date: 2009-06-14T03:21:07Z
WARC-Record-ID: <urn:uuid:...>
Content-Type: application/http; msgtype=response
Content-Length: 1270

HTTP/1.1 200 OK
Content-Type: text/html

<html> ...the page, byte for byte... </html>`}</pre>
        <p>
          Because the bytes are untouched, a WARC is a faithful record of what
          the site actually served, including its mistakes. That last part
          matters a lot for the parser.
        </p>

        <h1 id="backend">Backend Stack</h1>
        <p>
          The backend is a small Docker Compose stack: PostgreSQL 18, a Bun
          API, a Bun parser and a WireGuard client. The WARC files live on
          storage on my home network and are mounted into both Bun containers.
        </p>

        <h2 id="bun-api">The Bun API</h2>
        <p>
          The API is a single TypeScript process on Bun, with no web framework.
          It uses Bun&apos;s built-in HTTP server (<code>Bun.serve</code> with a
          static route table) and Bun&apos;s built-in PostgreSQL client, so
          there&apos;s no Express and no <code>pg</code> package either. It
          answers read-only requests: search, a capture&apos;s timeline, the
          nearest capture to a date, the newest captures, archive stats, page
          replay and zip downloads.
        </p>
        <p>A few things it does that aren&apos;t obvious:</p>
        <ul>
          <li>
            <strong>It waits for the database before listening</strong>
            <p>
              So right after a restart it doesn&apos;t answer with errors while
              PostgreSQL is still starting up.
            </p>
          </li>
          <li>
            <strong>Long downloads are never cut off</strong>
            <p>
              Zip downloads can stream for a long time from slow storage, so
              the server&apos;s idle timeout is turned off. An earlier timeout
              closed sockets mid-download, and because the response was
              streamed, the browser happily reported a truncated zip as
              complete.
            </p>
          </li>
          <li>
            <strong>The disk scan is cached</strong>
            <p>
              The stats on the homepage come from walking the WARC folder, which
              is slow over the network. The scan runs in the background, is
              shared by every request that needs it, and serves the last result
              while it refreshes.
            </p>
          </li>
        </ul>

        <h2 id="postgresql">PostgreSQL: An Index, Not a Copy</h2>
        <p>
          Every archived response becomes a row that says which file it came
          from, which URL it was, when it was captured, its status and headers,
          and a pointer to its body: a byte offset and a byte length inside the
          WARC (plus the chunk sizes, if the body used chunked transfer
          encoding). URLs, content types and files live in their own lookup
          tables, so each capture refers to them by ID.
        </p>
        <p>
          Keeping only pointers keeps the database a fraction of the size of the
          archive, and the original WARCs stay the single source of truth.
        </p>
        <h3>Search</h3>
        <p>
          Search is a case-insensitive substring match on URLs, backed by a
          trigram index (<code>pg_trgm</code>). With millions of URLs, making it
          fast took a few tricks:
        </p>
        <ul>
          <li>
            <strong>Escaped wildcards</strong>
            <p>
              <code>%</code> and <code>_</code> in your query are treated as
              literal characters, so searching for <code>100%</code> doesn&apos;t
              turn into &quot;match everything&quot;.
            </p>
          </li>
          <li>
            <strong>Two query plans racing</strong>
            <p>
              Some searches are fastest walking the index in order, others need
              a broader plan. The API starts the ordered plan first. If it&apos;s
              still running after 250 ms, it starts the broad plan alongside it,
              keeps whichever finishes first, cancels the loser inside
              PostgreSQL, and remembers the winner for that query.
            </p>
          </li>
          <li>
            <strong>Keyset pagination</strong>
            <p>
              Each page of results hands back a cursor, and the next page
              continues the index scan from there instead of skipping rows with{" "}
              <code>OFFSET</code>. Deep pages cost about the same as the first
              one.
            </p>
          </li>
          <li>
            <strong>Honest, capped counts</strong>
            <p>
              Counting every match of a broad search is slow, so the count stops
              at 10,001 and the site shows &quot;10,000+&quot;.
            </p>
          </li>
          <li>
            <strong>A timeout budget checked in code</strong>
            <p>
              Each search query has a 7 second limit in PostgreSQL, and the
              frontend gives up after 10 seconds. The backend checks at startup
              that its limit fits inside the frontend&apos;s, so the two numbers
              can&apos;t silently drift apart.
            </p>
          </li>
        </ul>
        <h3>Nearest Capture in Time</h3>
        <p>
          A lot of the archive runs on one question: &quot;what&apos;s the
          capture of this URL closest to this date?&quot; It&apos;s answered
          with two tiny index lookups, the closest capture before the date and
          the closest after it, keeping whichever is nearer.
        </p>

        <h2 id="wireguard">The WireGuard Tunnel</h2>
        <p>
          The backend sits on my home network, and I didn&apos;t want to open
          ports on my router for it. Instead, a WireGuard client container on
          the home machine keeps a tunnel open to the VPS.
        </p>
        <p>
          The neat part is how the API joins the tunnel. In Docker Compose, the
          API container uses the WireGuard container&apos;s network namespace
          (<code>network_mode: service:&lt;wireguard&gt;</code>), so the API
          effectively <em>lives inside</em> the tunnel. The VPS reaches it
          directly at its tunnel address, with no port forwarding and no NAT
          rules on the home side, and the API can still reach PostgreSQL over
          the normal Compose network. The parser doesn&apos;t need the tunnel at
          all, so it stays outside it.
        </p>
        <pre>{`Home machine (Docker)
+--------------------------------------+
| PostgreSQL 18                        |
| Bun parser                           |
| WireGuard client                     |
|   '- Bun API (shares its network)    |
+------------------+-------------------+
                   |
                   |  WireGuard tunnel
                   |
+------------------+-------------------+
| VPS                                  |
|   WireGuard                          |
|   nginx --> archive API: Bun         |
|         --> everything else: Next.js |
+--------------------------------------+`}</pre>
        <p>
          On the VPS, nginx sends archive API requests across the tunnel
          straight to Bun, and everything else to the Next.js frontend.
        </p>

        <h1 id="frontend">Frontend</h1>
        <p>
          The website is a Next.js 16 app with a Windows 95 look: gradient
          title bars, beveled windows and desktop icons. It runs in Docker on
          the VPS. Bun is the frontend&apos;s package manager and test runner,
          and the production container serves it with Node.js. It stores no
          archive data of its own; everything comes from the Bun API.
        </p>
        <ul>
          <li>
            <strong>Two backend addresses</strong>
            <p>
              Server-side code talks to the API at an internal address the
              browser can&apos;t reach. Browser requests go to relative paths on
              the same site, and only the replay frame loads from the
              archive&apos;s public address.
            </p>
          </li>
          <li>
            <strong>Cached, prerendered pages</strong>
            <p>
              The homepage, the search landing page and the stats are
              prerendered with Next 16&apos;s Cache Components{" "}
              (<code>&quot;use cache&quot;</code>). After a parse run, a cache
              refresh hook can be called so new captures show up right away.
            </p>
          </li>
          <li>
            <strong>Staying up when the backend is down</strong>
            <p>
              A failed backend call becomes a value instead of an exception. The
              page falls back to the last known good numbers, clearly dated and
              marked as stale, instead of crashing or caching an error page. If
              the backend goes offline, the site still loads and tells you the
              archive isn&apos;t responding.
            </p>
          </li>
          <li>
            <strong>Searches live in the URL path</strong>
            <p>
              A search is a real page, like{" "}
              <code>/warcs/search/geocities.com</code>, which keeps the search landing page fully static and gives every
              search a shareable link. Old <code>?q=</code> links redirect to the
              new form.
            </p>
          </li>
          <li>
            <strong>Tools for AI agents</strong>
            <p>
              Every page registers WebMCP tools, so an AI agent in a supporting
              browser can search the archive, look a page up &quot;as of&quot; a
              date and open captures. Anything that returns archived content is
              marked as untrusted data, and the one tool that downloads asks you
              first.
            </p>
          </li>
        </ul>

        <h1 id="parser">The Parser</h1>
        <p>
          The parser is the heart of the project. It walks the WARC folder,
          reads every record, and writes a row to PostgreSQL for every HTTP
          response it finds.
        </p>
        <h3>mwarc: One Decoder, Two Runtimes</h3>
        <p>
          The WARC decoder, <code>mwarc</code>, is hand-written and has zero
          imports. It never touches the file system itself. Every byte reaches
          it through a <code>read(start, size)</code> function that the caller
          passes in. That one design choice lets the exact same file run in two
          places: inside Bun worker threads on the server, and bundled into
          your browser for the offline viewer.
        </p>
        <p>
          It also never reads the archived bodies while indexing. For each
          record it reads only two small header blocks, the WARC headers and
          the HTTP headers, works out where the body starts and how long it is,
          and jumps over it. Indexing a multi-gigabyte WARC mostly means reading
          headers.
        </p>
        <h3>Surviving Real-World WARCs</h3>
        <p>
          Real archives are messy, and most of <code>mwarc</code> exists
          because some real file broke an earlier version:
        </p>
        <ul>
          <li>
            HTTP header blocks that end in bare line feeds instead of{" "}
            <code>\r\n\r\n</code>.
          </li>
          <li>
            Status lines with no reason phrase, like{" "}
            <code>HTTP/1.1 302</code>. That&apos;s legal, and it used to kill
            whole multi-gigabyte files at their first redirect.
          </li>
          <li>
            Repeated headers (several <code>Set-Cookie</code> or{" "}
            <code>Vary</code> lines), which get joined instead of overwritten.
          </li>
          <li>
            Chunked bodies with no <code>Content-Length</code>. Chunked framing
            is self-delimiting, so the parser walks it to the final chunk and
            rebuilds the length.
          </li>
          <li>
            Lost framing. Before every record, the parser checks that the next
            bytes really start with a WARC version line. If they don&apos;t, it
            scans ahead for the next record and only accepts a candidate if
            that record&apos;s own length lands exactly on another record. Text
            that merely says <code>WARC/1.0</code> inside a page doesn&apos;t
            fool it.
          </li>
        </ul>
        <h3>Resumable Ingest</h3>
        <p>
          Parsing the whole collection takes a long time, so the parser is
          built to stop and pick up where it left off:
        </p>
        <ol>
          <li>
            <p>
              It finds every WARC and compares each file&apos;s saved progress
              with its current size, sorting files into new, resume, grew,
              replaced, retry or done. WARCs only ever get appended to, so a
              file that grew only has its new tail read.
            </p>
          </li>
          <li>
            <p>
              A pool of Bun worker threads (8 by default) takes files from a
              shared queue.
            </p>
          </li>
          <li>
            <p>
              Each worker collects rows in batches of 1,024 and sends a whole
              batch to PostgreSQL as one array, which a single database function
              inserts in one go. Re-inserting a record that&apos;s already there
              never creates a duplicate.
            </p>
          </li>
          <li>
            <p>
              Progress is checkpointed at the start of the oldest batch still
              being written. Batches can finish out of order, so resuming a
              little early is safe (duplicates are ignored), but resuming late
              would quietly lose records. The database only ever moves a
              checkpoint forward.
            </p>
          </li>
        </ol>

        <h1 id="online-replay">Replaying a Capture Online</h1>
        <p>
          When you open a capture, the frontend shows it in a sandboxed frame
          that loads from the API. The API looks up the capture&apos;s pointer
          and reads exactly those bytes from the WARC. It never scans a file at
          request time.
        </p>
        <ul>
          <li>
            <strong>HTML and CSS are rewritten</strong>
            <p>
              HTML goes through Bun&apos;s <code>HTMLRewriter</code>, and CSS
              links are rewritten too. Every link, image, stylesheet and script
              URL is pointed back at the archive, along with the date of the page
              you&apos;re viewing. Each asset then becomes its own &quot;nearest
              capture to this date&quot; lookup, so a 2009 page loads 2009
              images when the archive has them.
            </p>
          </li>
          <li>
            <strong>Everything else streams straight through</strong>
            <p>
              Images, video and other files stream directly from the WARC, with
              support for range requests so media can seek.
            </p>
          </li>
          <li>
            <strong>Clicks stay in the archive</strong>
            <p>
              A small script injected into the page catches link clicks and form
              submits and passes them up to the viewer, which finds the nearest
              capture of the target page and opens it, or tells you it
              wasn&apos;t archived.
            </p>
          </li>
        </ul>

        <h1 id="offline-viewer">The Offline Viewer</h1>
        <span className={post.notification}>
          Try it at{" "}
          <a href={`${SITE}/warcs/offline`} target="_blank" rel="noopener noreferrer">
            archives.m4cgyver.net/warcs/offline
          </a>
          . If you&apos;d rather use other tools, the archive&apos;s{" "}
          <a
            href={`${SITE}/guides/how-to-open-warc-file`}
            target="_blank"
            rel="noopener noreferrer"
          >
            guide to opening WARC files
          </a>{" "}
          covers several.
        </span>
        <p>
          The offline viewer opens your own <code>.warc</code>,{" "}
          <code>.warc.gz</code> and <code>.wacz</code> files and rebuilds their
          pages entirely in your browser. Nothing from your files is uploaded.
          It&apos;s a one-person project with no accounts and no users to sell,
          so there&apos;s no reason for your files to touch my server.
        </p>
        <h3>Parsing in the Browser</h3>
        <p>
          The Bun backend bundles the same parser it uses for indexing into a
          single script for Web Workers, and the viewer starts a pool of
          workers from it.
        </p>
        <ul>
          <li>
            <strong>Big files are split up</strong>
            <p>
              A plain <code>.warc</code> of 128 MB or more is cut into segments
              of at least 64 MB, one per worker. Each segment owns the records
              that start inside it, so neighbors never have to coordinate. When
              a worker runs out of work, it takes half of what the busiest
              worker has left, and that worker answers with the exact record
              where it stopped, so nothing is skipped or parsed twice.
            </p>
          </li>
          <li>
            <strong>
              <code>.warc.gz</code> is indexed while it&apos;s read
            </strong>
            <p>
              In a <code>.warc.gz</code>, each record is its own gzip member.
              The parser inflates the file once with fflate and notes where every
              member starts, so viewing a page later only inflates that one
              member.
            </p>
          </li>
          <li>
            <strong>
              <code>.wacz</code> needs no extraction
            </strong>
            <p>
              A WACZ is a zip of <code>.warc.gz</code> files. Tools like
              Browsertrix store them uncompressed inside the zip, so each one is
              just a slice of the file you picked. (A WACZ whose archives were
              compressed again inside the zip isn&apos;t supported.) The viewer hands each slice to its own worker
              without copying anything.
            </p>
          </li>
        </ul>
        <p>
          The workers send back only headers and byte locations, never the
          bodies. The page keeps the index in memory and builds a tree of every
          captured URL, grouped by site, along with each URL&apos;s capture
          timeline.
        </p>
        <h3>Rebuilding Pages</h3>
        <p>When you open a page, a dedicated view worker rebuilds it:</p>
        <ol>
          <li>
            <p>
              It reads the response body straight from your local file,
              inflating its gzip member, removing chunked framing and undoing
              any compression the server applied.
            </p>
          </li>
          <li>
            <p>
              It rewrites the HTML, CSS and JavaScript. For every URL in the
              page, it asks for the capture nearest in time to the page
              you&apos;re viewing, following up to 5 redirects and resolving
              revisit records (captures that say &quot;same as before&quot;) to
              the bytes they point at.
            </p>
          </li>
          <li>
            <p>
              Each resource it finds becomes a <code>blob:</code> URL, built
              recursively for stylesheets that pull in images and fonts.
              Anything missing points at a blank page or an empty file, never at
              the live site, so nothing present-day ever passes itself off as
              archived.
            </p>
          </li>
          <li>
            <p>
              The finished page loads in a sandboxed frame. An injected script
              catches clicks, form submits, script navigations,{" "}
              <code>fetch</code> and <code>XMLHttpRequest</code>, and answers
              them from your files.
            </p>
          </li>
          <li>
            <p>
              Your browser&apos;s Back and Forward buttons move through the pages
              you&apos;ve visited in the viewer.
            </p>
          </li>
        </ol>
        <p>
          A service worker caches the viewer and its parser, so once you&apos;ve
          opened it, it can start again without a connection.
        </p>

        <h1 id="downloads">Downloads</h1>
        <p>
          Both the archive and the offline viewer can save captures as a zip,
          and they share one zip writer:
        </p>
        <ul>
          <li>
            <strong>Streamed straight from the WARC</strong>
            <p>
              Files are stored uncompressed in the zip, so the server streams
              them directly from the WARC&apos;s byte ranges, computing each
              file&apos;s CRC-32 checksum on the fly. Because nothing is
              compressed, the exact size of the zip is known before the first
              byte is sent.
            </p>
          </li>
          <li>
            <strong>Whole pages, not just one file</strong>
            <p>
              Downloading an HTML or CSS capture pulls in the resources it uses,
              with links rewritten to point inside the zip, so the page opens
              offline.
            </p>
          </li>
          <li>
            <strong>A manifest in every zip</strong>
            <p>
              Each zip includes <code>_warc-manifest.json</code>, which records
              what happened to every requested item: stored, not found, too big
              and so on.
            </p>
          </li>
          <li>
            <strong>One writer, two copies</strong>
            <p>
              The server and the browser each have a copy of the zip writer, and
              a test fails if the two copies ever stop matching byte for byte.
            </p>
          </li>
        </ul>

        <h1 id="limits">Limits</h1>
        <p>
          The archive is a reconstruction, not a time machine. Some honest
          limits:
        </p>
        <ul>
          <li>
            The server indexes plain <code>.warc</code> files, so compressed
            archives get decompressed before they&apos;re parsed. The offline
            viewer reads all three formats directly.
          </li>
          <li>
            Online replay doesn&apos;t rewrite archived JavaScript, so pages that
            build their content in script can come out broken. The offline
            viewer handles more of these.
          </li>
          <li>
            Online replay matches URLs exactly, so a capture saved under{" "}
            <code>http://</code> won&apos;t be found when a page links to{" "}
            <code>https://</code> or a <code>www.</code> variant. It also
            doesn&apos;t resolve revisit records yet; the offline viewer does.
          </li>
          <li>
            The offline viewer parses locally, but its parser script comes from
            the backend, so a first-time visitor needs the archive to be online.
          </li>
        </ul>
      </Window>
    </>
  );
}
