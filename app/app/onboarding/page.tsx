// app/app/onboarding/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const RAW_BASE = process.env.NEXT_PUBLIC_SITE_URL || "";
const API_BASE = RAW_BASE.replace(/\/$/, "");

type OnboardingStatus = {
  agent_id: string;
  current_step: number;
  total_steps: number;
  completed_at: string | null;
};

async function serializeCookiesHeader() {
  // In some Next.js versions, `cookies()` returns a Promise in type definitions.
  const store = await cookies();
  const all = store.getAll();
  if (!all || all.length === 0) return "";
  return all.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function fetchJSON<T>(url: string, cookieHeader: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return (await res.json()) as T;
}

export default async function OnboardingIndexPage() {
  // Serialize cookies once (used for bootstrap + status fetch)
  const cookieHeader = await serializeCookiesHeader();

  /**
   * 1) Ensure onboarding row exists (bootstrap is idempotent)
   */
  await fetch(`${API_BASE}/api/onboarding/bootstrap`, {
    method: "POST",
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  /**
   * 2) Load onboarding status
   */
  const status = await fetchJSON<{ onboarding: OnboardingStatus }>(
    `${API_BASE}/api/onboarding/status`,
    cookieHeader
  );

  const onboarding = status.onboarding;

  /**
   * 3) If completed → dashboard
   */
  if (onboarding?.completed_at) {
    redirect("/app");
  }

  /**
   * 4) Redirect to current step
   */
  const step = onboarding?.current_step || 1;
  redirect(`/app/onboarding/step-${step}`);
}
