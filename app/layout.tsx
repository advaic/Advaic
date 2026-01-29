import "../styles/globals.css";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type Database } from "@/types/supabase";
import SupabaseProvider from "./supabase-provider";
import ClientRootLayout from "@/app/ClientRootLayout";

export const metadata = {
  title: "Advaic",
  description: "Dein AI-gestützter Maklerassistent",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // ✅ no await

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Next.js App Router forbids cookie mutation during render.
            // Cookie mutations are handled in middleware / route handlers.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Next.js App Router forbids cookie mutation during render.
            // Cookie mutations are handled in middleware / route handlers.
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="de">
      <body>
        <SupabaseProvider initialSession={session}>
          <ClientRootLayout session={session}>{children}</ClientRootLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
