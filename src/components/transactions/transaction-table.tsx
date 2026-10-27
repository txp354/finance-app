"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { deleteTransaction } from "@/actions/transactions";
import { RowActions } from "@/components/shared/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency, formatDate, formatSignedCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";
import { TransactionModal } from "./transaction-modal";

type Filter = "ALL" | "INCOME" | "EXPENSE";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        (filter === "ALL" || t.type === filter) &&
        (!q ||
          t.category.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)),
    );
  }, [transactions, filter, query]);

  const net = visible.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  function openModal(transaction: Transaction | null) {
    setEditing(transaction);
    setModalOpen(true);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="INCOME">Income</TabsTrigger>
            <TabsTrigger value="EXPENSE">Expenses</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search category or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
              aria-label="Search transactions"
            />
          </div>
          <Button onClick={() => openModal(null)}>
            <PlusIcon />
            Add
          </Button>
        </div>
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                    {transactions.length === 0 ? "No transactions yet. Add your first one." : "No matches."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pl-4 whitespace-nowrap tabular-nums">{formatDate(t.date)}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === "INCOME" ? "secondary" : "outline"}>{t.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-xs truncate sm:table-cell">
                      {t.description}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium whitespace-nowrap tabular-nums",
                        t.type === "INCOME" && "text-positive",
                      )}
                    >
                      {formatSignedCurrency(t.type === "INCOME" ? t.amount : -t.amount)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <RowActions
                        label={`${t.category} ${formatCurrency(t.amount)}`}
                        onEdit={() => openModal(t)}
                        onDelete={() => deleteTransaction(t.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {visible.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="pl-4 max-sm:hidden">
                    {visible.length} transaction{visible.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell colSpan={2} className="pl-4 sm:hidden">
                    {visible.length} transaction{visible.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell
                    className={cn("text-right tabular-nums", net >= 0 ? "text-positive" : "text-negative")}
                  >
                    {formatSignedCurrency(net)}
                  </TableCell>
                  <TableCell className="pr-4" />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      <TransactionModal open={modalOpen} onOpenChange={setModalOpen} transaction={editing} />
    </>
  );
}
