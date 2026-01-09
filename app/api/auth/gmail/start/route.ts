import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Only allow returning to dashboard paths
  const rawNext = url.searchParams.get("next") || "/app/konto/verknuepfungen";
  const nextPath = rawNext.startsWith("/app")
    ? rawNext
    : "/app/konto/verknuepfungen";

  // IMPORTANT: do NOT encode here – URLSearchParams will encode it for us
  const state = nextPath;

  const base = "https://accounts.google.com/o/oauth2/v2/auth";

  const redirectUri = new URL(
    "/api/auth/gmail/callback",
    process.env.NEXT_PUBLIC_SITE_URL
  ).toString();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" "),
    state,
  });

  return NextResponse.redirect(`${base}?${params.toString()}`);
}
