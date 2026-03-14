export const runtime = "nodejs";

export function GET() {
  const xml = String(process.env.BING_SITE_AUTH_XML || "").trim();

  if (!xml) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  const body = xml.endsWith("\n") ? xml : `${xml}\n`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
