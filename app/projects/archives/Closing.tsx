// Limits, the glossary and the update notes.
export function Closing() {
  return <>
    <h2 id="limits">What it can&apos;t do (yet)</h2>
    <p>The archive is a reconstruction, not a time machine. Some honest limits:</p>
    <ul>
      <li>
        <strong>Online replay matches URLs exactly.</strong> A capture saved under <code>http://</code>{" "}won&apos;t be
        found when a page links to <code>https://</code> or a <code>www.</code>{" "}variant. It also doesn&apos;t resolve
        revisit records yet; the offline viewer does.
      </li>
      <li>
        <strong>Online replay leaves scripts alone.</strong>{" "}It doesn&apos;t rewrite archived JavaScript or the URLs
        scripts build, and it doesn&apos;t catch the requests they make, so script-heavy pages can come out broken and
        archived scripts can still reach the live web. The offline viewer handles these.
      </li>
      <li>
        <strong>Some styling isn&apos;t rewritten online.</strong> Stylesheets and style attributes are, but
        inline <code>&lt;style&gt;</code>{" "}blocks aren&apos;t yet.
      </li>
      <li>
        <strong>Compressed captures don&apos;t replay online.</strong> A body the original server gzipped or deflated
        is sent without its encoding, so it comes out unreadable; the offline viewer decompresses it.
      </li>
      <li>
        <strong>The server indexes plain <code>.warc</code> files.</strong>{" "}Compressed archives get decompressed before
        they&apos;re parsed. The offline viewer reads all three formats directly.
      </li>
      <li>
        <strong>The offline viewer has gaps too.</strong>{" "}It doesn&apos;t decode Brotli-compressed responses yet, and a
        WACZ whose archives were compressed again inside the zip isn&apos;t supported.
      </li>
      <li>
        <strong>A first visit needs the archive online.</strong> The offline viewer parses locally, but its parser
        script comes from the backend, so a first-time visitor needs the archive to be up.
      </li>
    </ul>

    <h2 id="glossary">Terms used on this page</h2>
    <dl>
      <dt><strong>WARC</strong></dt>
      <dd>Web ARChive: a file of records, each holding a request, a response or metadata, with the HTTP bytes kept exactly as they were sent.</dd>
      <dt><strong>Revisit record</strong></dt>
      <dd>A capture that says &quot;same as before&quot; and points at an earlier response instead of storing its bytes again.</dd>
      <dt><strong>Gzip member</strong></dt>
      <dd>One independently compressed piece of a gzip file. In a <code>.warc.gz</code> each record is its own member.</dd>
      <dt><strong>WACZ</strong></dt>
      <dd>A zip that packages <code>.warc.gz</code> files together with indexes.</dd>
      <dt><strong>Chunked transfer encoding</strong></dt>
      <dd>An HTTP body sent as a series of length-prefixed pieces instead of one block of known length.</dd>
      <dt><strong>Trigram index</strong></dt>
      <dd>An index of every three-character slice of a text (<code>pg_trgm</code>{" "}in PostgreSQL), which makes &quot;contains&quot; searches fast.</dd>
      <dt><strong>Keyset pagination</strong></dt>
      <dd>Fetching the next page by continuing from the last row seen, instead of counting past the rows before it.</dd>
      <dt><strong>Network namespace</strong></dt>
      <dd>A container&apos;s own set of network interfaces. Sharing one makes two containers look like one machine on the network.</dd>
      <dt><strong>WireGuard</strong></dt>
      <dd>A small, fast VPN; here it joins the home machine and the VPS.</dd>
      <dt><strong>Web Worker</strong></dt>
      <dd>A background thread in the browser. A service worker is a different kind, which can cache a site so it works offline.</dd>
      <dt><strong><code>blob:</code> URL</strong></dt>
      <dd>A URL for data the page already holds in memory.</dd>
      <dt><strong>CRC-32</strong></dt>
      <dd>The checksum zip files store for each file, so a damaged file can be detected.</dd>
    </dl>

    <h2 id="update-notes">Updates</h2>
    <p>
      <time dateTime="2026-10-19">October 19, 2026</time>: restructured the page around how the data flows, redrew the
      diagrams, added the offline viewer&apos;s worker split and the index row, and corrected details against the
      source: how search pages, what the timeout check compares, what online replay rewrites, what the offline viewer
      decompresses, and how the website is built. The numbers in the introduction are from the archive&apos;s status
      page on that day.
    </p>
    <p><time dateTime="2026-10-06">October 6, 2026</time>: previous version.</p>
  </>;
}
