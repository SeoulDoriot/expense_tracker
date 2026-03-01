

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SettingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your account and app preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            ← Back
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Profile card */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-zinc-100">
                  <Image
                    src="/profile-logo.png"
                    alt="Profile"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    Your Profile
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    Update your name, email, and password.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SettingRow title="Account" desc="Change email / password" />
                <SettingRow title="Security" desc="Enable extra protection" />
                <SettingRow title="Notifications" desc="Email & app alerts" />
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="lg:col-span-7">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-zinc-900">Preferences</p>
              <p className="mt-1 text-xs text-zinc-500">
                These are UI-only for now. Later we can save them in Supabase.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ToggleCard
                  title="Dark mode"
                  desc="Switch theme"
                  defaultOn={false}
                />
                <ToggleCard
                  title="Auto currency"
                  desc="Use local format"
                  defaultOn
                />
                <ToggleCard
                  title="Show tips"
                  desc="Helpful hints"
                  defaultOn
                />
                <ToggleCard
                  title="Sounds"
                  desc="Button feedback"
                  defaultOn={false}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-10 rounded-xl bg-[#2F52FF] px-5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                >
                  Save
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
      </div>
      <span className="text-zinc-400">›</span>
    </div>
  );
}

function ToggleCard({
  title,
  desc,
  defaultOn,
}: {
  title: string;
  desc: string;
  defaultOn?: boolean;
}) {
  // UI-only toggle (no backend yet)
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-xs text-zinc-500">{desc}</p>
        </div>

        <div
          className={`h-6 w-11 rounded-full border p-0.5 transition ${
            defaultOn
              ? "bg-[#2F52FF] border-[#2F52FF]"
              : "bg-zinc-100 border-zinc-200"
          }`}
          aria-hidden="true"
        >
          <div
            className={`h-5 w-5 rounded-full bg-white shadow transition ${
              defaultOn ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}