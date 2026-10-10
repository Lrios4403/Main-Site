import type { NextRequest } from "next/server";
import { viewStats } from "@/lib/views";

// Today/total unique viewers for ?path= and for the whole site
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 2048 || /[?#\\]/.test(path)) {
    return Response.json({ error: "Invalid page path" }, {
      status: 400, headers: { "Cache-Control": "no-store" },
    });
  }
  try {
    return Response.json(viewStats(path), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to load view counts", error);
    return Response.json({ error: "View counts are temporarily unavailable" }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "1" },
    });
  }
}
