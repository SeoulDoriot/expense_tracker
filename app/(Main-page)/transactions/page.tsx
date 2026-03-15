"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
  type DbTransaction,
} from "@/src/db/transactions";
import { readStoredJson, removeStoredValue, writeStoredJson } from "@/src/lib/browserStorage";
import {
  convertCurrencyToUsd,
  convertUsdToCurrency,
  formatAppCurrency,
  getCurrencyCode,
} from "@/src/lib/appPreferences";
import { useAppPreferences } from "@/src/hooks/useAppPreferences";
import {
  getTransactionCategories,
  isValidTransactionCategory,
} from "@/src/lib/transactionCategories";

type TxType = "Income" | "Expense";
type TimeRange = "all_time" | "this_month" | "last_month";
type ModalMode = "create" | "edit";

type Transaction = {
  id: string;
  type: TxType;
  title: string;
  category: string;
  amount: number;
  occurred_on: string;
  note?: string;
};

type TransactionDraft = {
  formType: TxType;
  formTitle: string;
  formCategory: string;
  formAmount: string;
  formDate: string;
  formNote: string;
};

const TRANSACTION_DRAFT_KEY = "transactions-page-draft";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M10.5 19a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20h4l10-10a2.1 2.1 0 0 0-4-4L4 16v4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-100 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold",
          tone === "positive"
            ? "text-emerald-600"
            : tone === "negative"
            ? "text-rose-600"
            : "text-zinc-900"
        )}
      >
        {value}
      </p>
    </Card>
  );
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

function isInThisMonth(dateStr: string) {
  const d = parseDateYYYYMMDD(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isInLastMonth(dateStr: string) {
  const d = parseDateYYYYMMDD(dateStr);
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getFullYear() === last.getFullYear() && d.getMonth() === last.getMonth();
}

function AmountPill({
  type,
  amount,
  currency,
  language,
}: {
  type: TxType;
  amount: number;
  currency: "USD" | "KHR";
  language: "en" | "km";
}) {
  const signedAmount = type === "Income" ? amount : -amount;
  return (
    <span className={cn("text-sm font-semibold", type === "Income" ? "text-emerald-600" : "text-rose-500")}>
      {formatAppCurrency(signedAmount, currency, language, {
        signed: true,
        maximumFractionDigits: currency === "KHR" ? 0 : 2,
      })}
    </span>
  );
}

function TypeChip({ type }: { type: TxType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        type === "Income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
      )}
    >
      {type}
    </span>
  );
}

function formatEditableAmount(amountUsd: number, currency: "USD" | "KHR") {
  const converted = convertUsdToCurrency(amountUsd, currency);
  return currency === "KHR" ? String(Math.round(converted)) : converted.toFixed(2);
}

function mapDbTransaction(row: DbTransaction): Transaction {
  return {
    id: String(row.id),
    type: row.type === "income" ? "Income" : "Expense",
    title: String(row.title ?? ""),
    category: String(row.category ?? "General"),
    amount: typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0),
    occurred_on: typeof row.occurred_on === "string" ? row.occurred_on : String(row.occurred_on ?? ""),
    note: row.note ?? undefined,
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const { settings } = useAppPreferences();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  const [filterType, setFilterType] = useState<"all" | TxType>("all");
  const [range, setRange] = useState<TimeRange>("all_time");
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<TxType>("Expense");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("0.00");
  const [formDate, setFormDate] = useState(toYYYYMMDD(new Date()));
  const [formNote, setFormNote] = useState("");
  const categoryOptions = useMemo(() => getTransactionCategories(formType), [formType]);

  function applyDraft(draft?: TransactionDraft | null) {
    setFormType(draft?.formType ?? "Expense");
    setFormTitle(draft?.formTitle ?? "");
    setFormCategory(draft?.formCategory ?? "");
    setFormAmount(draft?.formAmount ?? "0.00");
    setFormDate(draft?.formDate ?? toYYYYMMDD(new Date()));
    setFormNote(draft?.formNote ?? "");
  }

  const restoreCreateDraft = useCallback(() => {
    applyDraft(readStoredJson<TransactionDraft>(TRANSACTION_DRAFT_KEY));
  }, []);

  function clearCreateDraft() {
    removeStoredValue(TRANSACTION_DRAFT_KEY);
    applyDraft(null);
  }

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await listTransactions(300);
      setTransactions(data.map(mapDbTransaction));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load transactions.";
      setErrorMsg(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    restoreCreateDraft();
    setDraftReady(true);
  }, [restoreCreateDraft]);

  useEffect(() => {
    if (!draftReady || modalMode !== "create") {
      return;
    }

    writeStoredJson<TransactionDraft>(TRANSACTION_DRAFT_KEY, {
      formType,
      formTitle,
      formCategory,
      formAmount,
      formDate,
      formNote,
    });
  }, [draftReady, formAmount, formCategory, formDate, formNote, formTitle, formType, modalMode]);

  useEffect(() => {
    if (!formCategory) {
      return;
    }

    if (!isValidTransactionCategory(formType, formCategory)) {
      setFormCategory("");
    }
  }, [formCategory, formType]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions
      .filter((t) => {
        if (range === "all_time") return true;
        return range === "this_month" ? isInThisMonth(t.occurred_on) : isInLastMonth(t.occurred_on);
      })
      .filter((t) => (filterType === "all" ? true : t.type === filterType))
      .filter((t) => {
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.note || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          parseDateYYYYMMDD(b.occurred_on).getTime() - parseDateYYYYMMDD(a.occurred_on).getTime()
      );
  }, [transactions, filterType, range, search]);

  const filteredStats = useMemo(() => {
    const income = filtered.filter((t) => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      count: filtered.length,
    };
  }, [filtered]);

  function openAddModal() {
    setModalMode("create");
    setEditingId(null);
    restoreCreateDraft();
    setErrorMsg(null);
    setOpen(true);
  }

  function openEditModal(transaction: Transaction) {
    setModalMode("edit");
    setEditingId(transaction.id);
    setFormType(transaction.type);
    setFormTitle(transaction.title);
    setFormCategory(transaction.category);
    setFormAmount(formatEditableAmount(transaction.amount, settings.currency));
    setFormDate(transaction.occurred_on);
    setFormNote(transaction.note ?? "");
    setErrorMsg(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setErrorMsg(null);

    if (modalMode === "edit") {
      setModalMode("create");
      setEditingId(null);
      restoreCreateDraft();
    }
  }

  async function saveTransaction() {
    const amt = Number(formAmount);

    if (!formTitle.trim() || !formCategory.trim() || !formDate.trim()) {
      setErrorMsg("Please fill in title, category, and date.");
      return;
    }

    if (!Number.isFinite(amt) || amt <= 0) {
      setErrorMsg("Amount must be greater than 0.");
      return;
    }

    setSaveLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: formTitle.trim(),
        type: formType === "Income" ? "income" : "expense",
        category: formCategory.trim(),
        amount: Math.round(convertCurrencyToUsd(amt, settings.currency) * 100) / 100,
        occurred_on: formDate,
        note: formNote.trim() ? formNote.trim() : null,
      } as const;

      if (modalMode === "edit" && editingId) {
        const updated = await updateTransaction(editingId, payload);
        setTransactions((prev) =>
          prev.map((transaction) =>
            transaction.id === editingId ? mapDbTransaction(updated) : transaction
          )
        );
        setModalMode("create");
        setEditingId(null);
        restoreCreateDraft();
      } else {
        const created = await createTransaction(payload);
        setTransactions((prev) => [mapDbTransaction(created), ...prev]);
        clearCreateDraft();
      }

      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save transaction.";
      setErrorMsg(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!window.confirm(`Delete "${transaction.title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(transaction.id);
    setErrorMsg(null);

    try {
      await deleteTransaction(transaction.id);
      setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));

      if (editingId === transaction.id) {
        setModalMode("create");
        setEditingId(null);
        restoreCreateDraft();
        setOpen(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete transaction.";
      setErrorMsg(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .motion-safe-anim { animation: none !important; transition: none !important; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-up { opacity: 0; animation: fadeUp 650ms ease-out forwards; }
        .fade-up.d1 { animation-delay: 80ms; }
        .fade-up.d2 { animation-delay: 180ms; }
        .fade-up.d3 { animation-delay: 280ms; }

        .hover-lift { transition: transform 220ms ease, box-shadow 220ms ease; }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 18px 45px rgba(15, 23, 42, 0.10); }
      `}</style>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-10">
        <div className="motion-safe-anim fade-up d1 flex min-h-[calc(100vh-140px)] flex-col rounded-[28px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-7 sm:px-8">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Transactions</h1>
              <p className="mt-1 text-sm text-zinc-500">Create, edit, search, and clean up every record.</p>
            </div>

            <button
              onClick={openAddModal}
              className="motion-safe-anim fade-up d2 inline-flex items-center gap-2 rounded-full bg-[#2F52FF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              <IconPlus />
              Add Transaction
            </button>
          </div>

          <div className="px-6 pb-6 pt-6 sm:px-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Net"
                value={formatAppCurrency(filteredStats.net, settings.currency, settings.language, {
                  signed: true,
                  maximumFractionDigits: settings.currency === "KHR" ? 0 : 2,
                })}
                tone={filteredStats.net >= 0 ? "positive" : "negative"}
              />
              <SummaryCard
                label="Income"
                value={formatAppCurrency(filteredStats.income, settings.currency, settings.language, {
                  maximumFractionDigits: settings.currency === "KHR" ? 0 : 2,
                })}
                tone="positive"
              />
              <SummaryCard
                label="Expense"
                value={formatAppCurrency(filteredStats.expense, settings.currency, settings.language, {
                  maximumFractionDigits: settings.currency === "KHR" ? 0 : 2,
                })}
                tone="negative"
              />
              <SummaryCard label="Records" value={String(filteredStats.count)} />
            </div>

            <div className="motion-safe-anim fade-up d2 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "Income", "Expense"] as const).map((k) => {
                  const active = filterType === k;
                  const label = k === "all" ? "All" : k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilterType(k)}
                      className={cn(
                        "h-9 rounded-xl px-4 text-sm font-semibold transition",
                        active ? "bg-[#2F52FF] text-white" : "text-zinc-500 hover:bg-zinc-50"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}

                <div className="mx-2 hidden h-6 w-px bg-zinc-200 sm:block" />

                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as TimeRange)}
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 outline-none hover:bg-zinc-50"
                >
                  <option value="all_time">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                </select>
              </div>

              <div className="relative w-full sm:w-[260px]">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <IconSearch />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                />
              </div>
            </div>

            {errorMsg ? (
              <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMsg}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-[44px_1fr_120px_110px] items-center px-2 text-xs font-semibold text-zinc-500 sm:grid-cols-[44px_1fr_140px_120px_130px]">
              <div />
              <div>Title</div>
              <div className="text-right">Amount</div>
              <div className="hidden sm:block text-right">Status</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="mt-3 flex-1 space-y-3 overflow-auto pr-1">
              {loading ? (
                <div className="motion-safe-anim fade-up d3 flex items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-14 text-center text-sm text-zinc-500">
                  Loading transactions...
                </div>
              ) : filtered.length === 0 ? (
                <div className="motion-safe-anim fade-up d3 flex items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-14 text-center text-sm text-zinc-500">
                  No transactions found for this filter.
                </div>
              ) : (
                filtered.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="hover-lift rounded-2xl border border-zinc-100 bg-white px-2 py-3"
                  >
                    <div className="grid grid-cols-[44px_1fr_120px_110px] items-center gap-2 sm:grid-cols-[44px_1fr_140px_120px_130px]">
                      <div className="flex items-center justify-center">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                            transaction.type === "Income"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-600"
                          )}
                        >
                          {transaction.type === "Income" ? "↗" : "↘"}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-900">{transaction.title}</p>
                          <TypeChip type={transaction.type} />
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                            {transaction.category}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {transaction.occurred_on}
                          {transaction.note ? ` • ${transaction.note}` : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <AmountPill
                          type={transaction.type}
                          amount={transaction.amount}
                          currency={settings.currency}
                          language={settings.language}
                        />
                      </div>

                      <div className="hidden text-right sm:block">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            transaction.type === "Income" ? "text-emerald-600" : "text-zinc-500"
                          )}
                        >
                          {transaction.type === "Income" ? "Received" : "Paid"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(transaction)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
                          aria-label={`Edit ${transaction.title}`}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(transaction)}
                          disabled={actionLoadingId === transaction.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${transaction.title}`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {modalMode === "edit" ? "Edit Transaction" : "Add Transaction"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {modalMode === "edit"
                        ? "Update the details and save the changes."
                        : "Cash out = Expense, cash in = Income."}
                    </p>
                  </div>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-50"
                    onClick={closeModal}
                  >
                    <IconClose />
                  </button>
                </div>

                {errorMsg ? <p className="mt-3 text-sm text-rose-600">{errorMsg}</p> : null}

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600">Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as TxType)}
                      className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                    >
                      <option value="Expense">Expense</option>
                      <option value="Income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600">Title</label>
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Coffee, Salary, Rent..."
                      className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600">
                        Amount ({getCurrencyCode(settings.currency)})
                      </label>
                      <input
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600">Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600">Note (optional)</label>
                    <input
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="Any detail you want to remember"
                      className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-[#2F52FF]/20"
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveTransaction()}
                      disabled={saveLoading}
                      className="h-10 rounded-xl bg-[#111827] px-4 text-sm font-semibold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saveLoading
                        ? modalMode === "edit"
                          ? "Saving..."
                          : "Creating..."
                        : modalMode === "edit"
                        ? "Save Changes"
                        : "Save Transaction"}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
