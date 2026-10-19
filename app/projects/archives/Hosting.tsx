import ChartFigure from "@/components/article/charts/ChartFigure";
import { NetworkDiagram, networkText } from "./diagrams";

// Part 4: how a backend at home is reachable without open ports, and the
// archive's own website. Structure only: no addresses, ports or hostnames.
export function Hosting() {
  return <>
    <h2 id="hosting">Part 4: A home server with no open ports</h2>
    <p>
      The backend sits on my home network, and I didn&apos;t want to open ports on my router for it. So the home
      machine dials out instead: a WireGuard client keeps a tunnel open to the VPS, and everything travels through it.
    </p>

    <h3 id="wireguard">The API lives inside the tunnel</h3>
    <p>
      The backend runs in Docker Compose: PostgreSQL 18, the Bun API, the Bun parser and a WireGuard client.
      The WARC files live on storage on my home network and are mounted into both Bun containers.
    </p>
    <p>
      The neat part is how the API joins the tunnel. In Docker Compose, the API container uses the WireGuard
      container&apos;s network namespace (<code>network_mode: service:&lt;wireguard&gt;</code>): it has no network of
      its own, it uses the WireGuard container&apos;s, so the tunnel is simply there. The VPS reaches the API directly
      at its tunnel address, with no port forwarding and no NAT rules on the home side, and the API can still reach
      PostgreSQL over the normal Compose network. The parser doesn&apos;t need the tunnel at all, so it stays outside.
    </p>
    <ChartFigure
      title="The tunnel"
      subtitle="The API shares the WireGuard client's network; nginx on the VPS splits the traffic."
      caption="Archive API requests, replays and the website's own data requests cross the tunnel; the pages themselves are rendered by Next.js on the VPS."
      text={networkText}
    >
      <NetworkDiagram />
    </ChartFigure>
    <p>
      On the VPS, nginx sends archive API requests across the tunnel straight to Bun, and everything else to the
      Next.js website. The website&apos;s own server code also calls the API over the tunnel, at an internal address
      the browser can&apos;t reach. Browser requests go to relative paths on the archive&apos;s site, and only the
      replay frame loads from the archive&apos;s public address.
    </p>

    <h3 id="frontend">The archive&apos;s website</h3>
    <p>
      The archive&apos;s website is a Next.js 16 app with a Windows 95 look: gradient title bars, beveled windows and
      desktop icons. It stores no archive data of its own; everything comes from the Bun API. Locally, Bun is its
      package manager and test runner; the production Docker image installs it with npm and serves it with Node.js.
    </p>
    <ul>
      <li>
        <strong>Staying up when the backend is down.</strong>{" "}A failed backend call becomes a value instead of an
        exception. The page falls back to the last known good numbers, clearly dated and marked as stale, instead of
        crashing or caching an error page. If the backend goes offline, the site still loads and tells you the archive
        isn&apos;t responding, and its error messages never show the backend&apos;s address.
      </li>
      <li>
        <strong>Cached, prerendered pages.</strong>{" "}The homepage, the search landing page and the stats are prerendered
        with Next 16&apos;s Cache Components (<code>&quot;use cache&quot;</code>). After a parse run, a refresh hook
        marks the cached data stale, so new captures show up within a visit or two.
      </li>
      <li>
        <strong>Searches live in the URL path.</strong> A search is a real page, like{" "}
        <code>/warcs/search/geocities.com</code>, which keeps the search landing page fully static and gives every
        search a shareable link. Old <code>?q=</code> links redirect to the new form.
      </li>
      <li>
        <strong>Tools for AI agents.</strong>{" "}Every page registers WebMCP tools (a proposed browser API that lets a page
        offer tools to an AI agent), so an agent in a supporting browser can search the archive, look a page up
        &quot;as of&quot; a date and open captures. Anything that returns archived content is marked as untrusted data,
        and the one tool that downloads is flagged so a supporting browser asks you first.
      </li>
    </ul>
  </>;
}
