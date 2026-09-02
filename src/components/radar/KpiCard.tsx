import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "low" | "medium" | "high" | "critical";
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{label}</p>
        <span
          className={cn("rounded-md p-1.5", {
            "bg-accent text-accent-foreground": tone === "neutral",
            "bg-risk-low-soft text-risk-low": tone === "low",
            "bg-risk-medium-soft text-risk-medium": tone === "medium",
            "bg-risk-high-soft text-risk-high": tone === "high",
            "bg-risk-critical-soft text-risk-critical": tone === "critical",
          })}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
