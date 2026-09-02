import { AlertTriangle, CheckCircle2, OctagonAlert, ShieldAlert } from "lucide-react";
import { RISK_META, type RiskLevel } from "@/data/radar";
import { cn } from "@/lib/utils";

const ICONS: Record<RiskLevel, typeof CheckCircle2> = {
  BAIXO: CheckCircle2,
  MEDIO: AlertTriangle,
  ALTO: ShieldAlert,
  CRITICO: OctagonAlert,
};

const STYLES: Record<RiskLevel, string> = {
  BAIXO: "bg-risk-low-soft text-risk-low border-risk-low/30",
  MEDIO: "bg-risk-medium-soft text-risk-medium border-risk-medium/30",
  ALTO: "bg-risk-high-soft text-risk-high border-risk-high/30",
  CRITICO: "bg-risk-critical-soft text-risk-critical border-risk-critical/30",
};

export function RiskBadge({
  level,
  score,
  className,
}: {
  level: RiskLevel;
  score?: number;
  className?: string;
}) {
  const Icon = ICONS[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
        STYLES[level],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {RISK_META[level].label}
      {score !== undefined && <span className="tabular opacity-80">{score}</span>}
    </span>
  );
}

export function RiskBar({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", {
          "bg-risk-low": level === "BAIXO",
          "bg-risk-medium": level === "MEDIO",
          "bg-risk-high": level === "ALTO",
          "bg-risk-critical": level === "CRITICO",
        })}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
