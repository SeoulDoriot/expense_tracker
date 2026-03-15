"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
  type DbGoal,
} from "@/src/db/goals";
import {
  convertCurrencyToUsd,
  convertUsdToCurrency,
  formatAppCurrency,
  getCurrencyCode,
  type AppCurrency,
  type AppLanguage,
} from "@/src/lib/appPreferences";
import { useAppPreferences } from "@/src/hooks/useAppPreferences";

type Goal = {
  id: string;
  title: string;
  target: number;
  saved: number;
  contributingMonthly: number;
  imageUrl: string | null;
};

type GoalModalMode = "create" | "edit";

function formatMoney(n: number, currency: AppCurrency, language: AppLanguage) {
  return formatAppCurrency(n, currency, language, {
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  });
}

function formatEditableAmount(amountUsd: number, currency: AppCurrency) {
  const converted = convertUsdToCurrency(amountUsd, currency);
  return currency === "KHR" ? String(Math.round(converted)) : converted.toFixed(2);
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

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm se-hover-lift">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{helper}</p>
    </div>
  );
}

function StatusChip({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
      }`}
    >
      {done ? "Completed" : "In progress"}
    </span>
  );
}

function mapGoalRow(row: DbGoal): Goal {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    target: Number(row.target_amount ?? row.target ?? 0),
    saved: Number(row.saved_amount ?? row.saved ?? 0),
    contributingMonthly: Number(row.contributing_monthly ?? 0),
    imageUrl: row.image_url ?? null,
  };
}

export default function GoalsPage() {
  const router = useRouter();
  const { settings } = useAppPreferences();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [actionGoalId, setActionGoalId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<GoalModalMode>("create");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [contributingMonthly, setContributingMonthly] = useState("50");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");

  const totalSaved = useMemo(() => goals.reduce((sum, goal) => sum + goal.saved, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((sum, goal) => sum + goal.target, 0), [goals]);
  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.saved >= goal.target && goal.target > 0).length,
    [goals]
  );
  const completionRate = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalPercent = goals.reduce((sum, goal) => sum + Math.min(100, (goal.saved / goal.target) * 100), 0);
    return Math.round(totalPercent / goals.length);
  }, [goals]);

  function resetForm() {
    setTitle("");
    setTarget("");
    setSaved("");
    setContributingMonthly("50");
    setImagePreviewUrl("");
    setImageFileName("");
  }

  function closeModal() {
    setOpen(false);
    setModalMode("create");
    setEditingGoalId(null);
    setLoadError("");
    resetForm();
  }

  const loadGoalList = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await listGoals();
      setGoals(data.map(mapGoalRow));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load goals.";
      setLoadError(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadGoalList();
  }, [loadGoalList]);

  function openCreateModal() {
    resetForm();
    setModalMode("create");
    setEditingGoalId(null);
    setLoadError("");
    setOpen(true);
  }

  function openEditModal(goal: Goal) {
    setModalMode("edit");
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setTarget(formatEditableAmount(goal.target, settings.currency));
    setSaved(formatEditableAmount(goal.saved, settings.currency));
    setContributingMonthly(formatEditableAmount(goal.contributingMonthly, settings.currency));
    setImagePreviewUrl(goal.imageUrl ?? "");
    setImageFileName(goal.imageUrl ? "Existing image" : "");
    setLoadError("");
    setOpen(true);
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLoadError("Please choose a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 700 * 1024) {
      setLoadError("Please use an image smaller than 700 KB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setImagePreviewUrl(result);
      setImageFileName(file.name);
      setLoadError("");
    };
    reader.onerror = () => {
      setLoadError("Unable to read that image. Please try another file.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function saveGoal() {
    setLoadError("");

    const cleanTitle = title.trim();
    const targetNum = convertCurrencyToUsd(Number(target), settings.currency);
    const savedNum = convertCurrencyToUsd(Number(saved || "0"), settings.currency);
    const contribNum = convertCurrencyToUsd(Number(contributingMonthly || "0"), settings.currency);

    if (!cleanTitle) {
      setLoadError("Goal title is required.");
      return;
    }
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      setLoadError("Target amount must be greater than 0.");
      return;
    }
    if (!Number.isFinite(savedNum) || savedNum < 0) {
      setLoadError("Saved amount must be 0 or greater.");
      return;
    }
    if (!Number.isFinite(contribNum) || contribNum < 0) {
      setLoadError("Monthly contribution must be 0 or greater.");
      return;
    }

    const normalizedSaved = Math.min(savedNum, targetNum);

    setSavingGoal(true);

    try {
      const payload = {
        title: cleanTitle,
        target_amount: targetNum,
        saved_amount: normalizedSaved,
        contributing_monthly: contribNum,
        image_url: imagePreviewUrl || null,
      };

      if (modalMode === "edit" && editingGoalId) {
        const updated = await updateGoal(editingGoalId, payload);
        setGoals((prev) =>
          prev.map((goal) => (goal.id === editingGoalId ? mapGoalRow(updated) : goal))
        );
      } else {
        const created = await createGoal(payload);
        setGoals((prev) => [mapGoalRow(created), ...prev]);
      }

      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save goal.";
      setLoadError(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleDelete(goal: Goal) {
    if (!window.confirm(`Delete "${goal.title}"? This cannot be undone.`)) {
      return;
    }

    setActionGoalId(goal.id);
    setLoadError("");

    try {
      await deleteGoal(goal.id);
      setGoals((prev) => prev.filter((item) => item.id !== goal.id));

      if (editingGoalId === goal.id) {
        closeModal();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete goal.";
      setLoadError(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setActionGoalId(null);
    }
  }

  async function addMonthlyContribution(goal: Goal) {
    if (goal.saved >= goal.target) {
      return;
    }

    setActionGoalId(goal.id);
    setLoadError("");

    try {
      const updated = await updateGoal(goal.id, {
        saved_amount: Math.min(goal.target, goal.saved + Math.max(goal.contributingMonthly, 0)),
      });
      setGoals((prev) => prev.map((item) => (item.id === goal.id ? mapGoalRow(updated) : item)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add contribution.";
      setLoadError(message);

      if (message === "Not logged in.") {
        router.push("/Log_in");
      }
    } finally {
      setActionGoalId(null);
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .se-motion { animation: none !important; transition: none !important; }
        }

        @keyframes seFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes seScaleIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes seOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .se-page-in { opacity: 0; animation: seFadeUp 520ms ease-out forwards; }
        .se-card-in { opacity: 0; animation: seFadeUp 520ms ease-out forwards; }
        .se-modal-overlay { opacity: 0; animation: seOverlayIn 180ms ease-out forwards; }
        .se-modal-panel { opacity: 0; animation: seScaleIn 220ms ease-out forwards; }

        .se-hover-lift { transition: transform 220ms ease, box-shadow 220ms ease; }
        .se-hover-lift:hover { transform: translateY(-2px); box-shadow: 0 18px 60px rgba(0,0,0,0.12); }

        .se-btn { transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease, background-color 180ms ease; }
        .se-btn:active { transform: translateY(1px); }
      `}</style>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="min-h-[calc(100vh-140px)] rounded-[28px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5 se-motion se-page-in">
          <div className="px-6 py-8 sm:px-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-zinc-900">Goals</h1>
                <p className="mt-1 text-sm text-zinc-500">Create, update, fund, and close out your savings targets.</p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-md se-btn hover:bg-blue-700"
              >
                + Create Goal
              </button>
            </div>

            {loadError ? (
              <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                {loadError}
              </div>
            ) : null}

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Saved"
                value={formatMoney(totalSaved, settings.currency, settings.language)}
                helper="Total money already assigned to goals."
              />
              <SummaryCard
                label="Target"
                value={formatMoney(totalTarget, settings.currency, settings.language)}
                helper="Combined value of all current goals."
              />
              <SummaryCard
                label="Completed"
                value={`${completedGoals}/${goals.length || 0}`}
                helper="Goals that already reached 100%."
              />
              <SummaryCard
                label="Average Progress"
                value={`${completionRate}%`}
                helper="Average completion across all goals."
              />
            </div>

            {loading ? <p className="mb-6 text-sm text-zinc-500">Loading goals…</p> : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {goals.map((goal, idx) => {
                const pct = goal.target > 0 ? Math.max(0, Math.min(100, Math.round((goal.saved / goal.target) * 100))) : 0;
                const remaining = Math.max(0, goal.target - goal.saved);
                const monthsLeft =
                  goal.contributingMonthly > 0 && remaining > 0
                    ? Math.ceil(remaining / goal.contributingMonthly)
                    : 0;
                const done = pct >= 100;

                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm se-motion se-card-in se-hover-lift"
                    style={{ animationDelay: `${Math.min(idx, 12) * 60}ms` }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                          {goal.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={goal.imageUrl} alt={goal.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-zinc-400">
                              IMG
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-zinc-900">{goal.title}</h3>
                          <p className="text-xs text-zinc-400">
                            Target: {formatMoney(goal.target, settings.currency, settings.language)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusChip done={done} />
                        <button
                          type="button"
                          onClick={() => openEditModal(goal)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
                          aria-label={`Edit ${goal.title}`}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(goal)}
                          disabled={actionGoalId === goal.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${goal.title}`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3 h-2 w-full rounded-full bg-zinc-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">
                        Saved: {formatMoney(goal.saved, settings.currency, settings.language)}
                      </span>
                      <span className="text-zinc-400">
                        Remaining: {formatMoney(remaining, settings.currency, settings.language)}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Contribution / month</span>
                        <span>{formatMoney(goal.contributingMonthly, settings.currency, settings.language)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Progress</span>
                        <span>{pct}% complete</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                        <span>Estimated time left</span>
                        <span>{done ? "Reached" : monthsLeft > 0 ? `${monthsLeft} month${monthsLeft > 1 ? "s" : ""}` : "Set a monthly amount"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-zinc-500">
                        Keep this goal fresh by topping it up whenever you save.
                      </span>

                      <button
                        type="button"
                        onClick={() => void addMonthlyContribution(goal)}
                        disabled={actionGoalId === goal.id || done}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm se-btn hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {done
                          ? "Completed"
                          : `+ Add ${formatMoney(goal.contributingMonthly || 0, settings.currency, settings.language)}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && goals.length === 0 ? (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-14 text-center text-sm text-zinc-500">
                No goals yet. Create your first one and start tracking progress.
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 se-motion se-modal-overlay">
          <button
            type="button"
            aria-label="Close"
            onClick={closeModal}
            className="absolute inset-0 bg-black/30"
          />

          <div className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-xl se-motion se-modal-panel">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {modalMode === "edit" ? "Edit goal" : "Create goal"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {modalMode === "edit"
                    ? "Update target, progress, or the visual card."
                    : "Add a goal, target amount, and optional image."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-500 hover:bg-zinc-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-xs font-semibold text-zinc-600">Goal image (optional)</p>

                <div className="mt-3 flex items-center gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                    {imagePreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreviewUrl} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-zinc-400">
                        Preview
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100">
                      Choose image
                      <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
                    </label>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="text-xs text-zinc-500">
                        {imageFileName
                          ? imageFileName
                          : "PNG/JPG recommended. It will display as a small square on the card."}
                      </p>
                      {imagePreviewUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreviewUrl("");
                            setImageFileName("");
                          }}
                          className="text-xs font-semibold text-rose-600"
                        >
                          Remove image
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600">Goal title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New iPhone"
                  className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/25"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-600">
                    Target ({getCurrencyCode(settings.currency)})
                  </label>
                  <input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    inputMode="numeric"
                    placeholder="1500"
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-600">
                    Saved so far ({getCurrencyCode(settings.currency)})
                  </label>
                  <input
                    value={saved}
                    onChange={(e) => setSaved(e.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-600">
                    Contributing / month ({getCurrencyCode(settings.currency)})
                  </label>
                  <input
                    value={contributingMonthly}
                    onChange={(e) => setContributingMonthly(e.target.value)}
                    inputMode="numeric"
                    placeholder="50"
                    className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveGoal()}
                  disabled={savingGoal}
                  className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm se-btn hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingGoal
                    ? modalMode === "edit"
                      ? "Saving..."
                      : "Creating..."
                    : modalMode === "edit"
                    ? "Save Changes"
                    : "Create"}
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                The selected image is stored with the goal card so it stays visible after refresh.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
