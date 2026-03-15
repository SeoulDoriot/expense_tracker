import { supabase } from "@/src/lib/supabaseClient";

export type DbTransaction = {
  id: string;
  user_id: string;
  title: string;
  type: "income" | "expense";
  category: string | null;
  note: string | null;
  amount: number;
  occurred_on: string; // yyyy-mm-dd
  created_at: string;
};

export async function getRecentTransactions(limit = 5) {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  const user = sessionData.session?.user;
  if (!user) throw new Error("Not logged in.");

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as DbTransaction[];
}

export type NewTransactionInput = {
  title: string;
  type: "income" | "expense";
  category?: string | null;
  note?: string | null;
  amount: number;
  occurred_on: string; // yyyy-mm-dd
};

export type UpdateTransactionInput = Partial<NewTransactionInput>;

async function getRequiredUserId() {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  const user = sessionData.session?.user;
  if (!user) throw new Error("Not logged in.");

  return user.id;
}

export async function createTransaction(input: NewTransactionInput) {
  const userId = await getRequiredUserId();

  const payload = {
    user_id: userId,
    title: input.title,
    type: input.type,
    category: input.category ?? null,
    note: input.note ?? null,
    amount: input.amount,
    occurred_on: input.occurred_on,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as DbTransaction;
}

export async function listTransactions(limit = 50) {
  const userId = await getRequiredUserId();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as DbTransaction[];
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  const userId = await getRequiredUserId();

  const payload: Record<string, string | number | null> = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.type !== undefined) {
    payload.type = input.type;
  }
  if (input.category !== undefined) {
    payload.category = input.category ?? null;
  }
  if (input.note !== undefined) {
    payload.note = input.note ?? null;
  }
  if (input.amount !== undefined) {
    payload.amount = input.amount;
  }
  if (input.occurred_on !== undefined) {
    payload.occurred_on = input.occurred_on;
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as DbTransaction;
}

export async function deleteTransaction(id: string) {
  const userId = await getRequiredUserId();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
