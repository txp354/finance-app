"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createHolding, updateHolding } from "@/actions/portfolio";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { holdingSchema, type HoldingInput } from "@/lib/schemas";
import type { StockHolding } from "@/types";
import type { z } from "zod";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding?: StockHolding | null;
};

export function HoldingModal({ open, onOpenChange, holding }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{holding ? `Edit ${holding.ticker}` : "Add holding"}</DialogTitle>
          <DialogDescription>
            The latest closing price is fetched from Yahoo Finance when you save.
          </DialogDescription>
        </DialogHeader>
        <HoldingForm holding={holding} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function HoldingForm({ holding, onDone }: { holding?: StockHolding | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<HoldingInput, unknown, z.output<typeof holdingSchema>>({
    resolver: zodResolver(holdingSchema),
    defaultValues: holding
      ? { ticker: holding.ticker, shares: holding.shares, costBasis: holding.costBasis ?? undefined }
      : { ticker: "" },
  });
  const { errors } = form.formState;

  function onSubmit(values: z.output<typeof holdingSchema>) {
    startTransition(async () => {
      const result = holding ? await updateHolding(holding.id, values) : await createHolding(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.priceError) {
        toast.warning(`Saved ${values.ticker}, but couldn't fetch its price`, {
          description: result.priceError,
        });
      } else {
        toast.success(holding ? `${values.ticker} updated` : `${values.ticker} added`);
      }
      onDone();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.ticker}>
          <FieldLabel htmlFor="ticker">Ticker</FieldLabel>
          <Input
            id="ticker"
            placeholder="e.g. AAPL"
            autoCapitalize="characters"
            autoComplete="off"
            className="uppercase"
            aria-invalid={!!errors.ticker}
            {...form.register("ticker")}
          />
          <FieldError errors={[errors.ticker]} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.shares}>
            <FieldLabel htmlFor="shares">Shares</FieldLabel>
            <Input
              id="shares"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0"
              aria-invalid={!!errors.shares}
              {...form.register("shares", { setValueAs: toOptionalNumber })}
            />
            <FieldError errors={[errors.shares]} />
          </Field>

          <Field data-invalid={!!errors.costBasis}>
            <FieldLabel htmlFor="costBasis">Avg cost / share</FieldLabel>
            <Input
              id="costBasis"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="Optional"
              aria-invalid={!!errors.costBasis}
              {...form.register("costBasis", { setValueAs: toOptionalNumber })}
            />
            <FieldError errors={[errors.costBasis]} />
          </Field>
        </div>
        <FieldDescription>Add the average cost to track gain/loss.</FieldDescription>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : holding ? "Save changes" : "Add holding"}
        </Button>
      </DialogFooter>
    </form>
  );
}
