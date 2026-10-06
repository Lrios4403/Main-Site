import { NextResponse, type NextRequest } from "next/server";
import { recordView } from "@/lib/views";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

// Tracking pixel. The page being viewed comes from the Referer header (the
// page that loaded this <img>), and a long-lived cookie identifies the viewer.
export async function GET(request: NextRequest) {
  const existing = request.cookies.get("viewer")?.value;
  const viewer = existing ?? crypto.randomUUID();

  const referer = request.headers.get("referer");
  if (referer) {
    const from = new URL(referer);
    // Only count views of this site's own pages. Compared against the Host
    // header, not request.nextUrl: the production server builds nextUrl from
    // its own bind address (0.0.0.0:3000 in Docker), while nginx passes the
    // real host along in Host.
    if (from.host === request.headers.get("host")) recordView(from.pathname, viewer);
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
  return response;
}
