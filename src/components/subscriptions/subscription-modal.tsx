"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths } from "date-fns";
import { toast } from "sonner";
import { createSubscription, updateSubscription } from "@/actions/subscriptions";
import { toOptionalNumber } from "@/components/shared/form-utils";
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
import { Switch } from "@/components/ui/switch";
import { SUBSCRIPTION_CATEGORIES, subscriptionSchema, type SubscriptionInput } from "@/lib/schemas";
import { toDateInputValue } from "@/lib/utils";
import type { Subscription } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
};

export function SubscriptionModal({ open, onOpenChange, subscription }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subscription ? "Edit subscription" : "Add subscription"}</DialogTitle>
          <DialogDescription>A bill or service that renews on a schedule.</DialogDescription>
        </DialogHeader>
        <SubscriptionForm subscription={subscription} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionForm({ subscription, onDone }: { subscription?: Subscription | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: subscription
      ? {
          name: subscription.name,
          amount: subscription.amount,
          billingCycle: subscription.billingCycle,
          category: subscription.category,
          nextRenewalDate: toDateInputValue(subscription.nextRenewalDate),
          isActive: subscription.isActive,
        }
      : {
          name: "",
          billingCycle: "MONTHLY",
          category: "Subscriptions",
          nextRenewalDate: toDateInputValue(addMonths(new Date(), 1)),
          isActive: true,
        },
  });
  const { errors } = form.formState;

  const categories: string[] = [...SUBSCRIPTION_CATEGORIES];
  const currentCategory = form.watch("category");
  if (currentCategory && !categories.includes(currentCategory)) categories.unshift(currentCategory);

  function onSubmit(values: SubscriptionInput) {
    startTransition(async () => {
      const result = subscription
        ? await updateSubscription(subscription.id, values)
        : await createSubscription(values);
      if (result.success) {
        toast.success(subscription ? "Subscription updated" : "Subscription added");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" placeholder="e.g. Netflix" aria-invalid={!!errors.name} {...form.register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
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

          <Field>
            <FieldLabel htmlFor="billingCycle">Billing cycle</FieldLabel>
            <Controller
              control={form.control}
              name="billingCycle"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="billingCycle" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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
                  <SelectTrigger id="category" className="w-full">
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

          <Field data-invalid={!!errors.nextRenewalDate}>
            <FieldLabel htmlFor="nextRenewalDate">Next renewal</FieldLabel>
            <Input
              id="nextRenewalDate"
              type="date"
              aria-invalid={!!errors.nextRenewalDate}
              {...form.register("nextRenewalDate")}
            />
            <FieldError errors={[errors.nextRenewalDate]} />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <FieldLabel htmlFor="isActive">Active (counts toward monthly cost)</FieldLabel>
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : subscription ? "Save changes" : "Add subscription"}
        </Button>
      </DialogFooter>
    </form>
  );
}
