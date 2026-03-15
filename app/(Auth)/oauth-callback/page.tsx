"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES, clearSocialAuthIntent } from "@/src/lib/authFlow";
import { toFriendlyAuthMessage } from "@/src/lib/authMessages";
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

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    let active = true;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    const client = supabase;

    function redirectToLogin(nextMessage: string) {
      clearSocialAuthIntent();
      setMessage(nextMessage);

      window.setTimeout(() => {
        if (!active) {
          return;
        }

        router.replace(AUTH_ROUTES.login);
      }, 500);
    }

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active || !session) {
        return;
      }

      clearSocialAuthIntent();
      router.replace(AUTH_ROUTES.dashboard);
    });

    async function finishOAuth() {
      const url = new URL(window.location.href);
      const providerError =
        url.searchParams.get("error_description") ?? url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const tokens = getTokensFromHash();

      if (providerError) {
        redirectToLogin(toFriendlyAuthMessage(providerError));
        return;
      }

      if (code) {
        setMessage("Confirming your Google sign-in...");

        const { error } = await client.auth.exchangeCodeForSession(code);
        if (!active) {
          return;
        }

        if (error) {
          redirectToLogin(toFriendlyAuthMessage(error.message));
          return;
        }

        clearSocialAuthIntent();
        router.replace(AUTH_ROUTES.dashboard);
        return;
      }

      if (tokens) {
        setMessage("Restoring your session...");

        const { error } = await client.auth.setSession(tokens);
        if (!active) {
          return;
        }

        if (error) {
          redirectToLogin(toFriendlyAuthMessage(error.message));
          return;
        }

        clearSocialAuthIntent();
        router.replace(AUTH_ROUTES.dashboard);
        return;
      }

      const { data, error } = await client.auth.getSession();
      if (!active) {
        return;
      }

      if (error) {
        redirectToLogin(toFriendlyAuthMessage(error.message));
        return;
      }

      if (data.session) {
        clearSocialAuthIntent();
        router.replace(AUTH_ROUTES.dashboard);
        return;
      }

      setMessage("Waiting for sign-in to finish...");

      window.setTimeout(async () => {
        const retry = await client.auth.getSession();
        if (!active) {
          return;
        }

        if (retry.data.session) {
          clearSocialAuthIntent();
          router.replace(AUTH_ROUTES.dashboard);
          return;
        }

        if (retry.error) {
          redirectToLogin(toFriendlyAuthMessage(retry.error.message));
          return;
        }

        redirectToLogin("Google sign-in did not complete. Redirecting to login...");
      }, 1200);
    }

    void finishOAuth();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm">
        <p className="text-base font-medium text-zinc-700">{message}</p>
      </div>
    </div>
  );
}
