"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/src/lib/authFlow";
import { getSupabaseBrowserClient } from "@/src/lib/supabaseBrowser";

function getTokensFromHash() {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash;
  if (!hash || !hash.includes("access_token")) {
    return null;
  }

  const params = new URLSearchParams(hash.replace("#", ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (!access_token || !refresh_token) {
    return null;
  }

  return { access_token, refresh_token };
}

export default function AuthSessionRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === AUTH_ROUTES.oauthCallback) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || typeof window === "undefined") {
      return;
    }

    const client = supabase;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const tokens = getTokensFromHash();

    if (!code && !tokens) {
      return;
    }

    let active = true;

    async function restoreOAuthSession() {
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (!active) {
          return;
        }

        if (error) {
          router.replace(AUTH_ROUTES.login);
          return;
        }

        router.replace(AUTH_ROUTES.dashboard);
        return;
      }

      if (tokens) {
        const { error } = await client.auth.setSession(tokens);
        if (!active) {
          return;
        }

        if (error) {
          router.replace(AUTH_ROUTES.login);
          return;
        }

        router.replace(AUTH_ROUTES.dashboard);
      }
    }

    void restoreOAuthSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return null;
}
