"use server";

import { parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { subscriptionSchema, type ActionResult } from "@/lib/schemas";

function toData(input: unknown) {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  return { data: { ...parsed.data, nextRenewalDate: parseISO(parsed.data.nextRenewalDate) } };
}

function revalidate() {
  revalidatePath("/subscriptions");
  revalidatePath("/");
}

export async function createSubscription(input: unknown): Promise<ActionResult> {
  const result = toData(input);
  if (!result.data) return { success: false, error: result.error };
  await db.subscription.create({ data: result.data });
  revalidate();
  return { success: true };
}

export async function updateSubscription(id: string, input: unknown): Promise<ActionResult> {
  const result = toData(input);
  if (!result.data) return { success: false, error: result.error };
  try {
    await db.subscription.update({ where: { id }, data: result.data });
  } catch {
    return { success: false, error: "Subscription not found" };
  }
  revalidate();
  return { success: true };
}

export async function setSubscriptionActive(id: string, isActive: boolean): Promise<ActionResult> {
  const { count } = await db.subscription.updateMany({ where: { id }, data: { isActive } });
  if (count === 0) return { success: false, error: "Subscription not found" };
  revalidate();
  return { success: true };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  const { count } = await db.subscription.deleteMany({ where: { id } });
  if (count === 0) return { success: false, error: "Subscription not found" };
  revalidate();
  return { success: true };
}
