import { NextResponse, type NextRequest } from "next/server";
import { recordView, type Visit } from "@/lib/views";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// Tracking pixel. The page being viewed comes from the Referer header (the
// page that loaded this <img>), and a long-lived cookie identifies the viewer.
export async function GET(request: NextRequest) {
  const uuid = (value: string | undefined | null) =>
    value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      ? value : undefined;
  const existing = uuid(request.cookies.get("viewer")?.value);
  const viewer = existing ?? crypto.randomUUID();
  const session = (existing && uuid(request.cookies.get("view_session")?.value)) ?? crypto.randomUUID();
  const referer = request.headers.get("referer");
  let from: URL | undefined;
  try {
    if (referer) from = new URL(referer);
  } catch {
    // A malformed referrer cannot identify a page.
  }
  if (from) {
    // Only count views of this site's own pages. Compared against the Host
    // header, not request.nextUrl: the production server builds nextUrl from
    // its own bind address (0.0.0.0:3000 in Docker), while nginx passes the
    // real host along in Host.
    if (from.host === request.headers.get("host")) {
      const requestedPath = request.nextUrl.searchParams.get("path");
      const path = requestedPath ?? from.pathname;
      if (!path.startsWith("/") || path.startsWith("//") || path.length > 2048 || /[?#\\]/.test(path)) {
        return new NextResponse(null, { status: 400 });
      }
      const visit: Visit = {
        id: uuid(request.nextUrl.searchParams.get("id")) ?? crypto.randomUUID(),
        session,
        referrer: null,
        // The no-JS pixel cannot see the original document's referrer.
        source: request.nextUrl.searchParams.has("source") ? "direct" : "unknown",
      };
      const source = request.nextUrl.searchParams.get("source");
      if (source) {
        try {
          const url = new URL(source);
          if (url.protocol === "http:" || url.protocol === "https:") {
            visit.referrer = (url.origin + url.pathname).slice(0, 2048);
            visit.source = url.host === from.host ? "internal" : "external";
          } else {
            visit.source = "unknown";
          }
        } catch {
          visit.source = "unknown";
        }
      }
      try {
        recordView(path, viewer, visit);
      } catch (error) {
        console.error("Unable to record view", error);
        return new NextResponse(null, {
          status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "1" },
        });
      }
    }
  }

  const response = new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
  if (!existing) {
    response.cookies.set("viewer", viewer, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  // Thirty minutes of inactivity starts a new session.
  response.cookies.set("view_session", session, {
    path: "/", maxAge: 30 * 60, httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
