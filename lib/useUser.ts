// lib/useUser.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // adjust path
import { User } from "@supabase/supabase-js";

// ⚠️ This hook only works in client components. Do NOT use in server actions or server components.
export function useClientUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      }
      setUser(data?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
