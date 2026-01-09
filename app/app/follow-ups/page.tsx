// app/follow-ups/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import FollowUpsUI from "./FollowUpsUI";
import { Database } from "@/types/supabase";
import Link from "next/link";

export default async function FollowUpsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: async () => {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600">
        <div className="text-center space-y-3">
          <p>Nicht eingeloggt.</p>
          <Link
            href="/login"
            className="inline-block rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  return <FollowUpsUI userId={session.user.id} />;
}
