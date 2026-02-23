"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Dashboard", href: "/Main-page" },
  { label: "Transactions", href: "/Main-page/transactions" },
  { label: "Goals", href: "/Main-page/goals" },
  { label: "Report", href: "/Main-page/report" },
  { label: "Settings", href: "/Main-page/settings" },
];

export default function MainPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Left Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#2F52FF]/10" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Smart Expense
              </p>
              <p className="text-xs text-zinc-400">Tracker</p>
            </div>
          </div>

          {/* Center Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/Main-page" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition ${
                    active ? "text-[#2F52FF]" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Search (optional) */}
          <input
            placeholder="Search..."
            className="hidden h-10 w-[220px] rounded-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-[#2F52FF]/20 md:block"
          />
        </div>

        {/* Mobile Nav */}
        <div className="mx-auto max-w-6xl px-6 pb-3 md:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/Main-page" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                    active
                      ? "bg-[#2F52FF] text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}