const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:4010").replace(
  /\/$/,
  "",
);
const internalSecret = String(process.env.INTERNAL_SECRET || "").trim();
const checkAppRedirect =
  String(process.env.CHECK_APP_REDIRECT || "").toLowerCase() === "true";

async function request(method, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const init = { method, headers };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${baseUrl}${path}`, init);
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

function expectStatus(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function expectIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label}: expected to include "${needle}"`);
  }
}

async function main() {
  // Public page smoke checks
  expectStatus((await request("GET", "/")).status, 200, "GET /");
  expectStatus((await request("GET", "/preise")).status, 200, "GET /preise");
  expectStatus((await request("GET", "/produkt")).status, 200, "GET /produkt");
  expectStatus((await request("GET", "/faq")).status, 200, "GET /faq");
  expectStatus((await request("GET", "/login")).status, 200, "GET /login");

  // Optional app redirect check (requires working auth env)
  if (checkAppRedirect) {
    const app = await request("GET", "/app", { headers: { Accept: "text/html" } });
    expectStatus(app.status, 307, "GET /app");
    const location = String(app.headers.get("location") || "");
    expectIncludes(location, "/login?next=", "GET /app location");
  }

  // Public API shape checks
  expectStatus(
    (await request("GET", "/api/outlook/webhook")).status,
    200,
    "GET /api/outlook/webhook",
  );
  expectStatus(
    (await request("GET", "/api/gmail/push")).status,
    405,
    "GET /api/gmail/push",
  );
  expectStatus(
    (await request("GET", "/api/pipeline/reply-ready/send/run")).status,
    405,
    "GET /api/pipeline/reply-ready/send/run",
  );

  // Auth gates without secret
  expectStatus(
    (await request("POST", "/api/notifications/dispatch", { body: {} })).status,
    401,
    "POST /api/notifications/dispatch (no secret)",
  );
  expectStatus(
    (await request("POST", "/api/notifications/enqueue", { body: {} })).status,
    401,
    "POST /api/notifications/enqueue (no secret)",
  );
  expectStatus(
    (await request("POST", "/api/ai/intent-classify", { body: { text: "Hallo" } }))
      .status,
    401,
    "POST /api/ai/intent-classify (no secret)",
  );
  expectStatus(
    (await request("POST", "/api/ai/email-classify", { body: { text: "Hallo" } }))
      .status,
    401,
    "POST /api/ai/email-classify (no secret)",
  );

  // Internal validation check independent from DB connectivity
  if (internalSecret) {
    const enqueue = await request("POST", "/api/notifications/enqueue", {
      headers: { "x-advaic-internal-secret": internalSecret },
      body: { agent_id: "not-a-uuid", type: "approval_required_created" },
    });
    expectStatus(enqueue.status, 400, "POST /api/notifications/enqueue invalid UUID");
  }

  console.log("Smoke checks passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
