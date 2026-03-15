import { supabase } from "@/src/lib/supabaseClient";

export type DbGoal = {
  id: string;
  user_id: string;
  title: string | null;
  target_amount?: number | null;
  target?: number | null;
  saved_amount?: number | null;
  saved?: number | null;
  contributing_monthly?: number | null;
  image_url?: string | null;
  created_at?: string | null;
};

export type GoalInput = {
  title: string;
  target_amount: number;
  saved_amount: number;
  contributing_monthly: number;
  image_url?: string | null;
};

const GOAL_SELECT =
  "id,title,target_amount,target,saved_amount,saved,contributing_monthly,image_url,created_at,user_id";

async function getRequiredUserId() {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;

  const user = sessionData.session?.user;
  if (!user) throw new Error("Not logged in.");

  return user.id;
}

export async function listGoals() {
  const userId = await getRequiredUserId();

  const query = supabase
    .from("goals")
    .select(GOAL_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const ordered = await query;
  if (!ordered.error) {
    return ordered.data as DbGoal[];
  }

  if (!String(ordered.error.message ?? "").toLowerCase().includes("created_at")) {
    throw ordered.error;
  }

  const fallback = await supabase
    .from("goals")
    .select(GOAL_SELECT.replace(",created_at", ""))
    .eq("user_id", userId);

  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []) as unknown as DbGoal[];
}

export async function createGoal(input: GoalInput) {
  const userId = await getRequiredUserId();

  const payload = {
    user_id: userId,
    title: input.title,
    target_amount: input.target_amount,
    target: input.target_amount,
    saved_amount: input.saved_amount,
    saved: input.saved_amount,
    contributing_monthly: input.contributing_monthly,
    image_url: input.image_url ?? null,
  };

  const { data, error } = await supabase
    .from("goals")
    .insert(payload)
    .select(GOAL_SELECT)
    .single();

  if (error) throw error;
  return data as DbGoal;
}

export async function updateGoal(id: string, input: Partial<GoalInput>) {
  const userId = await getRequiredUserId();

  const payload: Record<string, string | number | null> = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.target_amount !== undefined) {
    payload.target_amount = input.target_amount;
    payload.target = input.target_amount;
  }
  if (input.saved_amount !== undefined) {
    payload.saved_amount = input.saved_amount;
    payload.saved = input.saved_amount;
  }
  if (input.contributing_monthly !== undefined) {
    payload.contributing_monthly = input.contributing_monthly;
  }
  if (input.image_url !== undefined) {
    payload.image_url = input.image_url ?? null;
  }

  const { data, error } = await supabase
    .from("goals")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select(GOAL_SELECT)
    .single();

  if (error) throw error;
  return data as DbGoal;
}

export async function deleteGoal(id: string) {
  const userId = await getRequiredUserId();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
