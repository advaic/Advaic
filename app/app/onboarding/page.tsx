// app/app/onboarding/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL || "";

type OnboardingStatus = {
  agent_id: string;
  current_step: number;
  total_steps: number;
  completed_at: string | null;
};

async function fetchJSON<T>(url: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Cookie: cookies().toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return (await res.json()) as T;
}

export default async function OnboardingIndexPage() {
  /**
   * 1. Ensure onboarding row exists
   *    (bootstrap is idempotent)
   */
  await fetch(`${API_BASE}/api/onboarding/bootstrap`, {
    method: "POST",
    headers: {
      Cookie: cookies().toString(),
    },
    cache: "no-store",
  });

  /**
   * 2. Load onboarding status
   */
  const status = await fetchJSON<{ onboarding: OnboardingStatus }>(
    `${API_BASE}/api/onboarding/status`
  );

  const onboarding = status.onboarding;

  /**
   * 3. If completed → dashboard
   */
  if (onboarding.completed_at) {
    redirect("/app");
  }

  /**
   * 4. Redirect to current step
   */
  const step = onboarding.current_step || 1;

  redirect(`/app/onboarding/step-${step}`);
}
