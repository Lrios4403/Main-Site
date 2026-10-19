import ArticleTable from "@/components/article/ArticleTable";
import ChartFigure from "@/components/article/charts/ChartFigure";
import { IndexDiagram, indexText } from "./diagrams";

// Part 2: the database row, the parser, the WARCs that broke it, and how a
// long parse stops and resumes.
export function Indexing() {
  return <>
    <h2 id="indexing">Part 2: Indexing terabytes without copying them</h2>
    <p>
      The parser walks the WARC folder, reads every record, and writes one row to PostgreSQL for every HTTP response
      it finds. The rows stay small because they don&apos;t hold the responses, only where the responses are.
    </p>

    <h3 id="postgresql">The database stores where, not what</h3>
    <p>
      Every archived response becomes a row that says which file it came from, which URL it was, when it was
      captured, its status and its HTTP headers, and a pointer to its body: a byte offset and a byte length inside the
      WARC. If the server sent the body with chunked transfer encoding (in length-prefixed pieces), the row keeps the
      chunk sizes too, so replay can strip the framing. URLs, content types and files live in their own lookup tables,
      so each capture refers to them by ID.
    </p>
    <ChartFigure
      title="An index, not a copy"
      subtitle="A row points at a byte range; the WARC file holds the bytes."
      caption="The offset and length are the only link between the database and the archived body."
      text={indexText}
    >
      <IndexDiagram />
    </ChartFigure>
    <p>
      Keeping only pointers keeps the database a fraction of the size of the archive, and the original WARCs stay the
      single source of truth.
    </p>

    <h3 id="parser">One parser, two runtimes</h3>
    <p>
      The WARC decoder, <code>mwarc</code>, is hand-written and has zero imports. It never touches the file system
      itself: every byte reaches it through a <code>read(start, size)</code> function that the caller passes in. That
      one design choice lets the exact same file run in two places, inside Bun worker threads on the server and bundled
      into your browser for the <a href="#offline-viewer">offline viewer</a>.
    </p>
    <p>
      It also avoids reading the archived bodies while indexing. For most records it reads only the WARC headers and
      the HTTP headers, works out where the body starts and how long it is, and jumps over it. Chunked bodies are the
      exception: it walks their chunk framing so the sizes can be stored for replay. Indexing a multi-gigabyte WARC is
      mostly reading headers.
    </p>

    <h3 id="real-world-warcs">What real WARCs break</h3>
    <p>
      Real archives are messy, and most of <code>mwarc</code> exists because some real file broke an earlier version:
    </p>
    <ul>
      <li>
        <strong>Bare line feeds.</strong> HTTP header blocks that end in bare line feeds instead
        of <code>\r\n\r\n</code>.
      </li>
      <li>
        <strong>No reason phrase.</strong> Status lines like <code>HTTP/1.1 302</code>, with nothing after the code.
        That&apos;s legal, and it used to kill whole multi-gigabyte files at their first redirect.
      </li>
      <li>
        <strong>Repeated headers.</strong> Several <code>Set-Cookie</code> or <code>Vary</code> lines get joined
        instead of the last one winning.
      </li>
      <li>
        <strong>Records with no length.</strong> A record missing its WARC <code>Content-Length</code> can still be read
        when its HTTP body is chunked: chunked framing is self-delimiting, so the parser walks it to the final chunk and
        rebuilds the length.
      </li>
      <li>
        <strong>Holes and padding.</strong> Runs of NUL bytes in the middle of a file, some hundreds of megabytes long,
        are scanned past, and NUL padding at the end of a file counts as a clean end.
      </li>
      <li>
        <strong>Dates that don&apos;t parse.</strong> A <code>Last-Modified</code>{" "}header the parser can&apos;t read is
        stored as empty instead of failing the record.
      </li>
      <li>
        <strong>Lost framing.</strong>{" "}Sometimes a record&apos;s declared length is wrong, and the next read would land
        in the middle of a record. Before every record, the parser checks that the next bytes really start with a WARC
        version line. If they don&apos;t, it scans ahead and only accepts a candidate whose own length lands exactly on
        another record. Text that merely says <code>WARC/1.0</code>{" "}inside a page doesn&apos;t fool it.
      </li>
    </ul>

    <h3 id="resumable-ingest">Stopping a long parse and picking it up later</h3>
    <p>
      Parsing the whole collection takes a long time, so the parser is built to stop and pick up where it left off.
      It starts by finding every WARC and comparing each file&apos;s saved progress with its current size. WARCs only
      ever get appended to, so a file that grew only has its new tail read:
    </p>
    <ArticleTable caption="How each file is classified before a run" columns={["State", "When", "Where parsing starts"]} rows={[
      ["new", "No progress saved yet", "The beginning"],
      ["resume", "An earlier run was interrupted", "The last checkpoint"],
      ["grew", "Fully parsed, but the file is bigger now", "The old end: only the new tail"],
      ["replaced", "Fully parsed, but the file is smaller now, so it's a different file", "The beginning"],
      ["retry", "The last attempt failed", "The last good record boundary"],
      ["done", "Fully parsed and the same size", "Skipped"],
    ]} />
    <ol>
      <li>
        <p>A pool of Bun worker threads (8 by default) takes files from a shared queue.</p>
      </li>
      <li>
        <p>
          Each worker collects rows in batches of 1,024 and sends a whole batch to PostgreSQL as one array, which a
          single database function inserts in one go. Re-inserting a record that&apos;s already there never creates a
          duplicate.
        </p>
      </li>
      <li>
        <p>
          Progress is checkpointed at the start of the oldest batch still being written. Batches can finish out of
          order, so resuming a little early is safe (duplicates are ignored), but resuming late would quietly lose
          records. The database only ever moves a checkpoint forward.
        </p>
      </li>
    </ol>
  </>;
}
