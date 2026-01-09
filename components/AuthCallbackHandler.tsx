"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const url = window.location.href;
      const { error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        console.error("Error exchanging code for session:", error.message);
      }

      router.replace("/"); // redirect after auth
    };

    handleAuth();
  }, []);

  return null;
}
