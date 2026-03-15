"use client";

import { supabase } from "@/src/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";
import {
  formatAppCurrency,
  getLocaleForLanguage,
  type AppCurrency,
  type AppLanguage,
} from "@/src/lib/appPreferences";
import { useAppPreferences } from "@/src/hooks/useAppPreferences";

type TxType = "Income" | "Expense";

type Transaction = {
  id: string;
  user_id?: string;
  type: TxType;
  title: string;
  category: string;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  note?: string;
};

type TransactionRow = {
  id: string | number;
  user_id?: string | null;
  type?: unknown;
  title?: string | null;
  category?: string | null;
  amount?: number | string | null;
  occurred_on?: string | Date | null;
  note?: string | null;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateYYYYMMDD(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysBack(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toYYYYMMDD(d);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function normalizeTransactionType(value: unknown): TxType {
  return String(value).toLowerCase() === "income" ? "Income" : "Expense";
}

function formatMoney(n: number, currency: AppCurrency, language: AppLanguage) {
  return formatAppCurrency(n, currency, language, {
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  });
}

function formatMonthLabel(d: Date, language: AppLanguage) {
  return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
    month: "short",
  }).format(d);
}

/* ---------- tiny icons (no external lib) ---------- */
function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5c0-1.4 1.1-2.5 2.5-2.5H18a2 2 0 0 1 2 2v1.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 9.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.5H6.5A2.5 2.5 0 0 0 4 9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M18 13h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconPercent() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- simple SVG charts ---------- */
function BarCompareChart({
  title,
  subtitle,
  income,
  expense,
  currency,
  language,
}: {
  title: string;
  subtitle: string;
  income: number;
  expense: number;
  currency: AppCurrency;
  language: AppLanguage;
}) {
  const max = Math.max(income, expense, 1);

  const incomeH = Math.round((income / max) * 180);
  const expenseH = Math.round((expense / max) * 180);

  return (
    <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="px-6 pt-6">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Income</p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">{formatMoney(income, currency, language)}</p>
          </div>
          <div className="rounded-2xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">Expense</p>
            <p className="mt-2 text-sm font-semibold text-red-950">{formatMoney(expense, currency, language)}</p>
          </div>
        </div>

        <div className="mt-4 h-[240px] sm:h-[260px] w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-100">
          <svg viewBox="0 0 360 220" className="h-full w-full">
            {[0.2, 0.4, 0.6, 0.8].map((t) => {
              const y = 200 - t * 160;
              return <line key={t} x1="38" y1={y} x2="322" y2={y} stroke="#E4E4E7" strokeWidth="1" />;
            })}
            <line x1="30" y1="200" x2="340" y2="200" stroke="#E5E7EB" strokeWidth="2" />

            <rect x="90" y={200 - incomeH} width="70" height={incomeH} rx="12" fill="#10B981" opacity="0.85" />
            <rect x="200" y={200 - expenseH} width="70" height={expenseH} rx="12" fill="#EF4444" opacity="0.85" />

            <text x="125" y="214" textAnchor="middle" fontSize="12" fill="#6B7280">
              Income
            </text>
            <text x="235" y="214" textAnchor="middle" fontSize="12" fill="#6B7280">
              Expense
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function LineTrendChart({
  title,
  subtitle,
  points,
  currency,
  language,
}: {
  title: string;
  subtitle: string;
  points: Array<{ xLabel: string; value: number }>;
  currency: AppCurrency;
  language: AppLanguage;
}) {
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = points.length ? total / points.length : 0;
  const peak = values.length ? Math.max(...values) : 0;

  const W = 360;
  const H = 220;
  const padX = 24;
  const padY = 22;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const coords = points.map((p, i) => {
    const x = padX + (points.length <= 1 ? 0 : (i / (points.length - 1)) * innerW);
    const y = padY + (1 - p.value / max) * innerH;
    return { x, y };
  });

  const d = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const areaD =
    coords.length > 0
      ? `${d} L ${coords[coords.length - 1].x.toFixed(1)} ${(H - padY).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(H - padY).toFixed(1)} Z`
      : "";

  return (
    <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="px-6 pt-6">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Average / day</p>
            <p className="mt-2 text-sm font-semibold text-blue-950">{formatMoney(average, currency, language)}</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 px-4 py-3 ring-1 ring-indigo-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700">Peak day</p>
            <p className="mt-2 text-sm font-semibold text-indigo-950">{formatMoney(peak, currency, language)}</p>
          </div>
        </div>

        <div className="mt-4 h-[240px] sm:h-[260px] w-full rounded-2xl bg-zinc-50 ring-1 ring-zinc-100">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
            <defs>
              <linearGradient id="report-trend-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2F52FF" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#2F52FF" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((t) => {
              const y = padY + t * innerH;
              return <line key={t} x1={padX} y1={y} x2={W - padX} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
            })}
            <path d={areaD} fill="url(#report-trend-fill)" />
            <path d={d} fill="none" stroke="#2F52FF" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {coords.map((c, idx) => (
              <circle key={idx} cx={c.x} cy={c.y} r="4" fill="#2F52FF" opacity="0.9" />
            ))}
          </svg>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{points[0]?.xLabel || ""}</span>
          <span>{points[Math.floor(points.length / 2)]?.xLabel || ""}</span>
          <span>{points[points.length - 1]?.xLabel || ""}</span>
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdownCard({
  title,
  subtitle,
  items,
  currency,
  language,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; amount: number; share: number }>;
  currency: AppCurrency;
  language: AppLanguage;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="px-6 pt-6">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="px-6 pb-6 pt-5">
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.label} className="rounded-2xl bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-zinc-900">{item.label}</p>
                  <p className="text-sm font-semibold text-zinc-700">
                    {formatMoney(item.amount, currency, language)}
                  </p>
                </div>

                <div className="mt-3 h-2.5 rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-[#2F52FF]"
                    style={{ width: `${Math.max(10, Math.round(item.share * 100))}%` }}
                  />
                </div>

                <p className="mt-2 text-[11px] text-zinc-500">{Math.round(item.share * 100)}% of this month&apos;s expense</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-500">
            No monthly expense categories yet.
          </div>
        )}
      </div>
    </div>
  );
}

function RecentMonthsCard({
  title,
  subtitle,
  months,
  currency,
  language,
}: {
  title: string;
  subtitle: string;
  months: Array<{ label: string; income: number; expense: number; net: number }>;
  currency: AppCurrency;
  language: AppLanguage;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
      <div className="px-6 pt-6">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="px-6 pb-6 pt-5">
        <div className="space-y-3">
          {months.map((month) => (
            <div key={month.label} className="rounded-2xl bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">{month.label}</p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    month.net >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}
                >
                  {month.net >= 0 ? "Positive" : "Negative"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] text-zinc-500">Income</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {formatMoney(month.income, currency, language)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">Expense</p>
                  <p className="mt-1 text-xs font-semibold text-red-700">
                    {formatMoney(month.expense, currency, language)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500">Net</p>
                  <p className={cn("mt-1 text-xs font-semibold", month.net >= 0 ? "text-zinc-900" : "text-red-700")}>
                    {formatMoney(month.net, currency, language)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  tone,
  onInfo,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: "neutral" | "income" | "expense" | "rate";
  onInfo: () => void;
}) {
  const toneCls =
    tone === "income"
      ? "text-emerald-700 bg-emerald-100"
      : tone === "expense"
      ? "text-red-600 bg-red-100"
      : tone === "rate"
      ? "text-indigo-700 bg-indigo-100"
      : "text-zinc-700 bg-zinc-100";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_25px_rgba(0,0,0,0.08)] ring-1 ring-black/5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] transition duration-200 hover:-translate-y-[2px]">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", toneCls)}>{icon}</div>

        <button
          onClick={onInfo}
          className="h-9 w-9 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition flex items-center justify-center"
          title="Info"
          type="button"
        >
          <IconInfo />
        </button>
      </div>

      <p className="mt-3 text-xs font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-[11px] text-emerald-600">{sub}</p>
    </div>
  );
}

export default function ReportPage() {
  const { settings } = useAppPreferences();
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState<null | "net" | "income" | "expense" | "rate">(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      const fromDate = daysBack(120);

      let q = supabase
        .from("transactions")
        .select("id,user_id,type,title,category,amount,occurred_on,note")
        .gte("occurred_on", fromDate)
        .order("occurred_on", { ascending: false });

      if (userId) q = q.eq("user_id", userId);

      const { data, error } = await q;

      if (!alive) return;

      if (error) {
        console.error("Report load error:", error.message);
        setTx([]);
        setLoading(false);
        return;
      }

      const normalized: Transaction[] = ((data ?? []) as TransactionRow[]).map((row) => ({
        id: String(row.id),
        user_id: row.user_id ? String(row.user_id) : undefined,
        type: normalizeTransactionType(row.type),
        title: String(row.title ?? ""),
        category: String(row.category ?? ""),
        amount: typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0),
        occurred_on:
          typeof row.occurred_on === "string"
            ? row.occurred_on
            : row.occurred_on instanceof Date
            ? row.occurred_on.toISOString().slice(0, 10)
            : String(row.occurred_on ?? ""),
        note: row.note ?? undefined,
      }));

      setTx(normalized);
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const thisMonthKey = monthKey(new Date());

  const computed = useMemo(() => {
    const [currentYear, currentMonth] = thisMonthKey.split("-").map(Number);
    const referenceMonth = new Date(currentYear, (currentMonth || 1) - 1, 1);
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    const monthExpenseByDay = new Map<string, number>();
    const monthExpenseByCategory = new Map<string, number>();
    const monthlyTotals = new Map<string, { income: number; expense: number }>();

    for (const t of tx) {
      const amt = Math.abs(Number(t.amount) || 0);
      const occurredAt = parseDateYYYYMMDD(t.occurred_on);
      const mKey = monthKey(occurredAt);
      const monthlyEntry = monthlyTotals.get(mKey) ?? { income: 0, expense: 0 };

      if (t.type === "Income") {
        totalIncome += amt;
        monthlyEntry.income += amt;
        if (mKey === thisMonthKey) {
          thisMonthIncome += amt;
        }
      } else {
        totalExpense += amt;
        monthlyEntry.expense += amt;
        monthExpenseByDay.set(t.occurred_on, (monthExpenseByDay.get(t.occurred_on) ?? 0) + amt);

        if (mKey === thisMonthKey) {
          thisMonthExpense += amt;
          const category = t.category.trim() || "Other";
          monthExpenseByCategory.set(category, (monthExpenseByCategory.get(category) ?? 0) + amt);
        }
      }

      monthlyTotals.set(mKey, monthlyEntry);
    }

    const monthExpenseAbs = thisMonthExpense;
    const totalExpenseAbs = totalExpense;

    const netWorth = totalIncome - totalExpenseAbs;
    const savingRate =
      thisMonthIncome <= 0 ? 0 : Math.round(((thisMonthIncome - monthExpenseAbs) / thisMonthIncome) * 100);

    const days = 30;
    const labels: Array<{ xLabel: string; value: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toYYYYMMDD(d);
      const short = `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
      labels.push({ xLabel: short, value: monthExpenseByDay.get(key) ?? 0 });
    }

    const topCategories = Array.from(monthExpenseByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, amount]) => ({
        label,
        amount,
        share: monthExpenseAbs > 0 ? amount / monthExpenseAbs : 0,
      }));

    const recentMonths = Array.from({ length: 4 }, (_, idx) => {
      const date = new Date(referenceMonth.getFullYear(), referenceMonth.getMonth() - (3 - idx), 1);
      const key = monthKey(date);
      const totals = monthlyTotals.get(key) ?? { income: 0, expense: 0 };

      return {
        label: formatMonthLabel(date, settings.language),
        income: totals.income,
        expense: totals.expense,
        net: totals.income - totals.expense,
      };
    });

    return {
      netWorth,
      monthIncome: thisMonthIncome,
      monthExpense: monthExpenseAbs,
      savingRate,
      trend: labels,
      topCategories,
      recentMonths,
    };
  }, [tx, thisMonthKey, settings.language]);

  return (
    <div className="min-h-screen bg-transparent">
      {/* no navbar here (your layout already has it) */}
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .motion-safe-anim {
            animation: none !important;
            transition: none !important;
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-up {
          opacity: 0;
          animation: fadeUp 650ms ease-out forwards;
        }
        .fade-up.d1 {
          animation-delay: 80ms;
        }
        .fade-up.d2 {
          animation-delay: 180ms;
        }
        .fade-up.d3 {
          animation-delay: 280ms;
        }
      `}</style>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="motion-safe-anim fade-up d1 rounded-[28px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5 min-h-[calc(100vh-140px)] flex flex-col">
          {/* Header */}
          <div className="px-6 pt-7 sm:px-8">
            <h1 className="text-2xl font-semibold text-zinc-900">Report</h1>
            <p className="mt-1 text-sm text-zinc-500">Your financial summary & trends in one clean view.</p>
          </div>

          {/* Stats */}
          <div className="px-6 pb-2 pt-6 sm:px-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Net Worth"
                value={loading ? "—" : formatMoney(computed.netWorth, settings.currency, settings.language)}
                sub="All-time balance overview"
                icon={<IconWallet />}
                tone="neutral"
                onInfo={() => setInfoOpen("net")}
              />
              <StatCard
                title="Monthly Income"
                value={loading ? "—" : formatMoney(computed.monthIncome, settings.currency, settings.language)}
                sub="Total income this month"
                icon={<IconUp />}
                tone="income"
                onInfo={() => setInfoOpen("income")}
              />
              <StatCard
                title="Monthly Expense"
                value={loading ? "—" : formatMoney(computed.monthExpense, settings.currency, settings.language)}
                sub="Total spending this month"
                icon={<IconDown />}
                tone="expense"
                onInfo={() => setInfoOpen("expense")}
              />
              <StatCard
                title="Saving Rate"
                value={loading ? "—" : `${computed.savingRate}%`}
                sub="Based on this month"
                icon={<IconPercent />}
                tone="rate"
                onInfo={() => setInfoOpen("rate")}
              />
            </div>
          </div>

          {/* Charts */}
          <div className="px-6 pb-8 pt-6 sm:px-8 flex-1">
            <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
              <BarCompareChart
                title="Monthly Income vs Expense"
                subtitle="A simpler side-by-side view of this month"
                income={computed.monthIncome}
                expense={computed.monthExpense}
                currency={settings.currency}
                language={settings.language}
              />

              <LineTrendChart
                title="30-Day Spending Trend"
                subtitle="Your daily expense activity in a cleaner chart"
                points={computed.trend}
                currency={settings.currency}
                language={settings.language}
              />

              <CategoryBreakdownCard
                title="Top Expense Categories"
                subtitle="Where your spending is going this month"
                items={computed.topCategories}
                currency={settings.currency}
                language={settings.language}
              />

              <RecentMonthsCard
                title="Last 4 Months"
                subtitle="A quick monthly snapshot that is easier to scan"
                months={computed.recentMonths}
                currency={settings.currency}
                language={settings.language}
              />
            </div>

            {!loading && tx.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
                No transactions yet. Add transactions first, then your report will show real charts.
              </div>
            ) : null}
          </div>
        </div>

        {/* Info popup */}
        {infoOpen ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setInfoOpen(null)} />
            <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/10">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">What does this mean?</p>
                <button
                  type="button"
                  className="h-9 w-9 rounded-full bg-zinc-100 hover:bg-zinc-200 transition"
                  onClick={() => setInfoOpen(null)}
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 text-sm text-zinc-700 leading-6">
                {infoOpen === "net" ? (
                  <>
                    <p className="font-semibold">Net Worth</p>
                    <p className="mt-1">
                      This is your all-time balance: <b>Total Income</b> minus <b>Total Expenses</b>. It helps you see your
                      overall financial position.
                    </p>
                  </>
                ) : infoOpen === "income" ? (
                  <>
                    <p className="font-semibold">Monthly Income</p>
                    <p className="mt-1">Total money you earned this month (salary, side jobs, gifts, etc.).</p>
                  </>
                ) : infoOpen === "expense" ? (
                  <>
                    <p className="font-semibold">Monthly Expense</p>
                    <p className="mt-1">Total money you spent this month (food, bills, transport, shopping, etc.).</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Saving Rate</p>
                    <p className="mt-1">
                      How much you saved from your income this month: <b>(Income − Expense) / Income</b>. A higher % means
                      better saving behavior.
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={() => setInfoOpen(null)}
                className="mt-4 h-10 w-full rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1F2937] transition"
              >
                Got it
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
