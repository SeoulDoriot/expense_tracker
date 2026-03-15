"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/src/lib/authFlow";
import { toFriendlyAuthMessage } from "@/src/lib/authMessages";
import { getSupabaseBrowserClient } from "@/src/lib/supabaseBrowser";

export default function OtpRequestPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMsg("Email is required.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMsg("Supabase keys are missing. Please configure your environment variables.");
      setLoading(false);
      return;
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${AUTH_ROUTES.otpVerify}?email=${encodeURIComponent(cleanEmail)}&type=login`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (error) {
      return setMsg(toFriendlyAuthMessage(error.message));
    }

    router.push(`${AUTH_ROUTES.otpVerify}?email=${encodeURIComponent(cleanEmail)}&type=login`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={sendOtp} className="w-full max-w-sm space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Continue with email</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter an existing account email. We will send you a verification code and then sign you into the dashboard.
          </p>
        </div>

        <input
          className="w-full rounded-xl border border-zinc-200 p-3"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
  
        {msg && <p className={`text-sm ${msg.toLowerCase().includes("sent") ? "text-emerald-600" : "text-red-500"}`}>{msg}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-black p-3 text-white"
        >
          {loading ? "Sending..." : "Send verification code"}
        </button>

        <p className="text-center text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href={AUTH_ROUTES.signup} className="font-semibold text-zinc-900 underline">
            Create one first
          </Link>
        </p>
      </form>
    </div>
  );
}
