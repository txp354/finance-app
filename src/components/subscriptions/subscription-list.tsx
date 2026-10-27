"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteSubscription, setSubscriptionActive } from "@/actions/subscriptions";
import { RowActions } from "@/components/shared/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { BillingCycle, Subscription } from "@/types";
import { SubscriptionModal } from "./subscription-modal";

// Computed on the server so relative dates match between server and client render.
export type SubscriptionRow = Subscription & {
  monthlyAmount: number;
  upcomingRenewal: Date;
  daysUntilRenewal: number;
};

const CYCLE_LABEL: Record<BillingCycle, string> = { WEEKLY: "week", MONTHLY: "month", ANNUAL: "year" };

function renewalLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function SubscriptionList({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  function openModal(subscription: Subscription | null) {
    setEditing(subscription);
    setModalOpen(true);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openModal(null)}>
          <PlusIcon />
          Add subscription
        </Button>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden text-right md:table-cell">Per month</TableHead>
                <TableHead className="hidden sm:table-cell">Next renewal</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                    No subscriptions yet. Add your first one.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((s) => (
                  <TableRow key={s.id} className={cn(!s.isActive && "opacity-60")}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{s.name}</div>
                      <Badge variant="outline" className="mt-1">
                        {s.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatCurrency(s.amount)}
                      <span className="text-muted-foreground"> / {CYCLE_LABEL[s.billingCycle]}</span>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {formatCurrency(s.monthlyAmount)}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      <div className="tabular-nums">{formatDate(s.upcomingRenewal)}</div>
                      {s.isActive && (
                        <div className="text-muted-foreground text-xs">{renewalLabel(s.daysUntilRenewal)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <ActiveToggle subscription={s} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <RowActions
                        label={s.name}
                        onEdit={() => openModal(s)}
                        onDelete={() => deleteSubscription(s.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SubscriptionModal open={modalOpen} onOpenChange={setModalOpen} subscription={editing} />
    </>
  );
}

function ActiveToggle({ subscription }: { subscription: Subscription }) {
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={subscription.isActive}
      disabled={pending}
      aria-label={`${subscription.name} active`}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          const result = await setSubscriptionActive(subscription.id, checked);
          if (!result.success) toast.error(result.error);
        })
      }
    />
  );
}
