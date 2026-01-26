import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * DEPRECATED
 *
 * This endpoint was an early prototype that drafted replies directly.
 * The production pipeline is now split into explicit runner routes:
 * - /api/pipeline/route-resolve/run
 * - /api/pipeline/reply-ready/draft/run
 * - /api/pipeline/reply-ready/qa/run
 * - /api/pipeline/reply-ready/rewrite/run
 * - /api/pipeline/reply-ready/qa-recheck/run
 * - /api/pipeline/reply-ready/send/run
 *
 * Keeping this route active would duplicate logic and can create inconsistent states.
 */

export async function POST(req: Request) {
  // Optional shared-secret so nobody can hit this publicly.
  // We use the same secret header name as the other pipeline routes.
  const secret = req.headers.get("x-advaic-internal-secret");
  if (
    process.env.ADVAIC_INTERNAL_PIPELINE_SECRET &&
    secret !== process.env.ADVAIC_INTERNAL_PIPELINE_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "deprecated_endpoint",
      message:
        "This endpoint is deprecated. Use the dedicated runner routes under /api/pipeline/... instead.",
      runners: {
        route_resolve: "/api/pipeline/route-resolve/run",
        draft: "/api/pipeline/reply-ready/draft/run",
        qa: "/api/pipeline/reply-ready/qa/run",
        rewrite: "/api/pipeline/reply-ready/rewrite/run",
        qa_recheck: "/api/pipeline/reply-ready/qa-recheck/run",
        send: "/api/pipeline/reply-ready/send/run",
      },
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "deprecated_endpoint",
      message:
        "Use the dedicated runner routes under /api/pipeline/... instead.",
    },
    { status: 410 }
  );
}
