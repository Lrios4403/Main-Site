// Part 3: the API, search, the nearest-capture lookup, online replay and
// downloads.
export function Serving() {
  return <>
    <h2 id="serving">Part 3: Search, replay and downloads</h2>
    <p>
      Everything public goes through one read-only API: search, a URL&apos;s capture timeline, the nearest capture to
      a date, the newest captures, archive stats, page replay and zip downloads.
    </p>

    <h3 id="bun-api">A Bun API with no framework</h3>
    <p>
      The API is a single TypeScript process on Bun. It uses Bun&apos;s built-in HTTP server (<code>Bun.serve</code>{" "}
      with a static route table) and Bun&apos;s built-in PostgreSQL client, so there&apos;s no Express and
      no <code>pg</code>{" "}package either. Two things it does that aren&apos;t obvious:
    </p>
    <ul>
      <li>
        <strong>It waits for the database before listening.</strong>{" "}So right after a restart it doesn&apos;t answer
        with errors while PostgreSQL is still starting up.
      </li>
      <li>
        <strong>The disk scan is cached.</strong>{" "}The stats on the archive&apos;s homepage come from walking the WARC
        folder, which is slow over the network. The scan runs in the background, is shared by every request that needs
        it, and serves the last result while it refreshes.
      </li>
    </ul>

    <h3 id="search">Substring search over millions of URLs</h3>
    <p>
      Search is a case-insensitive substring match on URLs, backed by a trigram index (<code>pg_trgm</code>, an index
      of three-character slices, which is what makes a match anywhere in a URL fast). Results can be filtered by
      content type, and they come back shallowest path first, so a site&apos;s homepage is listed before its deep
      pages. With millions of URLs, making it fast took a few tricks:
    </p>
    <ul>
      <li>
        <strong>Escaped wildcards.</strong> <code>%</code> and <code>_</code> in your query are treated as literal
        characters, so searching for <code>100%</code>{" "}doesn&apos;t turn into &quot;match everything&quot;.
      </li>
      <li>
        <strong>Two query plans racing.</strong>{" "}Some searches are fastest walking the URL index in result order and
        stopping once a page is full; others need a broader plan that finds every match and then sorts. Which one wins
        depends on where the matches fall, not how many there are, and nothing cheap predicts it. So the API measures:
        it starts the ordered plan first, and if that&apos;s still running after 250 ms it starts the broad plan
        alongside it, keeps whichever finishes first, cancels the loser inside PostgreSQL, and remembers the winner for
        that query for ten minutes.
      </li>
      <li>
        <strong>Keyset pagination when you click Next.</strong> Each page of results hands back a cursor, and the Next
        link continues the index scan from there instead of skipping rows with <code>OFFSET</code>, so paging forward
        stays fast however deep you go. Jumping straight to a numbered page, or searching with a content-type filter,
        still uses <code>OFFSET</code>.
      </li>
      <li>
        <strong>Capped counts.</strong>{" "}Counting every match of a broad search is slow, so the count stops at 10,001
        and the site shows &quot;10,000+&quot;.
      </li>
      <li>
        <strong>A timeout budget.</strong>{" "}Each result query has a 7-second limit in PostgreSQL, and the website gives
        up after 10 seconds. The backend refuses to start if 7 seconds plus about a second of overhead wouldn&apos;t fit
        inside its own copy of the website&apos;s 10-second limit. That catches anyone raising the 7 seconds too far;
        lowering the website&apos;s real limit still has to be matched by hand.
      </li>
    </ul>

    <h3 id="nearest-capture">Which capture is closest to this date?</h3>
    <p>
      A lot of the archive runs on one question: &quot;what&apos;s the capture of this URL closest to this
      date?&quot; It&apos;s answered with two tiny index lookups, the closest capture before the date and the closest
      after it, keeping whichever is nearer. The nearer one can be the later one, which is why a 2009 page sometimes
      shows a 2011 image.
    </p>

    <h3 id="online-replay">Replaying a capture: rewrite the HTML, stream the rest</h3>
    <p>
      When you open a capture, the website shows it in a frame that loads from the API. The API looks up the
      capture&apos;s pointer (see <a href="#postgresql">the database row</a>) and reads exactly those bytes from the
      WARC. It never scans a file at request time.
    </p>
    <ul>
      <li>
        <strong>HTML and CSS are rewritten.</strong>{" "}HTML goes through Bun&apos;s <code>HTMLRewriter</code>, a built-in
        streaming HTML rewriter, and stylesheets and style attributes are rewritten too. Links, images, stylesheets and
        script tags are pointed back at the archive, along with the date of the page you&apos;re viewing, and each one
        becomes its own <a href="#nearest-capture">nearest-capture</a> lookup, so a 2009 page loads 2009 images when
        the archive has them.
      </li>
      <li>
        <strong>Everything else streams straight through.</strong> Images, video and other files stream directly from
        the WARC, with support for range requests, so media can seek.
      </li>
      <li>
        <strong>Clicks stay in the archive.</strong>{" "}A small script injected into the page catches link clicks and form
        submits and passes them up to the viewer, which finds the nearest capture of the target page and opens it, or
        tells you it wasn&apos;t archived. It works inside nested frames too.
      </li>
      <li>
        <strong>Small things that made forums work.</strong> <code>#fragments</code> are kept off the lookup so anchors
        still scroll, <code>mailto:</code> and <code>data:</code> links pass through untouched, and HTML entities in
        attribute URLs (<code>&amp;amp;</code>) are decoded before the lookup. That last one is what made XenForo and
        phpBB forums render with their styles.
      </li>
    </ul>

    <h3 id="downloads">Downloads stream straight out of the WARC</h3>
    <p>
      Both the archive and the offline viewer can save captures as a zip, and they share one zip writer, written by
      hand with no library:
    </p>
    <ul>
      <li>
        <strong>Streamed from the WARC.</strong>{" "}Files are stored uncompressed in the zip, so the server streams them
        directly from the WARC&apos;s byte ranges and computes each file&apos;s CRC-32 checksum on the fly. Because
        nothing is compressed, the exact size of the zip is known before the first byte is sent.
      </li>
      <li>
        <strong>Long downloads aren&apos;t cut off.</strong> Bun drops <code>Content-Length</code>{" "}from a streamed
        response, so the exact size goes out in a custom header instead, which browsers ignore: a browser can&apos;t
        use it to notice a short file. An earlier idle timeout closed sockets
        mid-download, and the browser happily reported the truncated zip as complete. The server&apos;s idle timeout is
        now off.
      </li>
      <li>
        <strong>Whole pages, not just one file.</strong> Downloading an HTML or CSS capture pulls in the resources it
        uses, with links rewritten to point inside the zip, so the page opens offline.
      </li>
      <li>
        <strong>Big and duplicate files.</strong> Files over 4 GB use zip64, file names keep their UTF-8, and identical
        bodies are stored once, so the http and https copies of a page become one entry.
      </li>
      <li>
        <strong>A manifest in every zip.</strong> Each zip includes <code>_warc-manifest.json</code>, which records what
        happened to every requested item: stored, not found, no body, short read, over budget, or an error. Pages and
        the resources they pull in share a budget of 5,000 entries and 2 GiB per request.
      </li>
      <li>
        <strong>One writer, two copies.</strong>{" "}The server and the offline viewer each have a copy of the zip writer,
        and a test compares the two copies byte for byte. Dropping the zip library this replaced cut about 131 KB of
        minified code, two thirds of it, from the offline viewer&apos;s parser bundle.
      </li>
    </ul>
  </>;
}
