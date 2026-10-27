"use server";

import { parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { transactionSchema, type ActionResult } from "@/lib/schemas";

function toData(input: unknown) {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { date, description, ...rest } = parsed.data;
  return { data: { ...rest, description: description || null, date: parseISO(date) } };
}

function revalidate() {
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function createTransaction(input: unknown): Promise<ActionResult> {
  const result = toData(input);
  if (!result.data) return { success: false, error: result.error };
  await db.transaction.create({ data: result.data });
  revalidate();
  return { success: true };
}

export async function updateTransaction(id: string, input: unknown): Promise<ActionResult> {
  const result = toData(input);
  if (!result.data) return { success: false, error: result.error };
  try {
    await db.transaction.update({ where: { id }, data: result.data });
  } catch {
    return { success: false, error: "Transaction not found" };
  }
  revalidate();
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { count } = await db.transaction.deleteMany({ where: { id } });
  if (count === 0) return { success: false, error: "Transaction not found" };
  revalidate();
  return { success: true };
}
