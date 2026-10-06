import type { NextRequest } from "next/server";
import { viewStats } from "@/lib/views";

// Today/total unique viewers for ?path= and for the whole site
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  return Response.json(viewStats(path), {
    headers: { "Cache-Control": "no-store" },
  });
}
