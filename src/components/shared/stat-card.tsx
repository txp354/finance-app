import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  hintClassName,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  hintClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          {label}
          {icon && <span className="[&_svg]:size-4">{icon}</span>}
        </div>
        <div className="truncate text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className={cn("text-muted-foreground text-xs", hintClassName)}>{hint}</div>}
      </CardContent>
    </Card>
  );
}
