"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRANSACTION_CATEGORIES, transactionSchema, type TransactionInput } from "@/lib/schemas";
import { toDateInputValue } from "@/lib/utils";
import { toOptionalNumber } from "@/components/shared/form-utils";
import type { Transaction } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
};

export function TransactionModal({ open, onOpenChange, transaction }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Record money coming in or going out.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the form resets each time the dialog opens. */}
        <TransactionForm transaction={transaction} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({ transaction, onDone }: { transaction?: Transaction | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description ?? "",
          date: toDateInputValue(transaction.date),
        }
      : { type: "EXPENSE", category: "", description: "", date: toDateInputValue(new Date()) },
  });
  const { errors } = form.formState;
  const type = form.watch("type");

  // Keep a category that isn't in the preset list (e.g. from seed data) selectable.
  const categories: string[] = [...TRANSACTION_CATEGORIES[type]];
  const currentCategory = form.watch("category");
  if (currentCategory && !categories.includes(currentCategory)) categories.unshift(currentCategory);

  function onSubmit(values: TransactionInput) {
    startTransition(async () => {
      const result = transaction
        ? await updateTransaction(transaction.id, values)
        : await createTransaction(values);
      if (result.success) {
        toast.success(transaction ? "Transaction updated" : "Transaction added");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.type}>
            <FieldLabel htmlFor="type">Type</FieldLabel>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("category", "");
                  }}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field data-invalid={!!errors.amount}>
            <FieldLabel htmlFor="amount">Amount</FieldLabel>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={!!errors.amount}
              {...form.register("amount", { setValueAs: toOptionalNumber })}
            />
            <FieldError errors={[errors.amount]} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.category}>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.category]} />
          </Field>

          <Field data-invalid={!!errors.date}>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input id="date" type="date" aria-invalid={!!errors.date} {...form.register("date")} />
            <FieldError errors={[errors.date]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
          <Input id="description" placeholder="e.g. Weekly groceries" {...form.register("description")} />
          <FieldError errors={[errors.description]} />
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
        </Button>
      </DialogFooter>
    </form>
  );
}
