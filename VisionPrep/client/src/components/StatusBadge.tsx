import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { ProcessingStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: ProcessingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    queued: {
      icon: Clock,
      label: "Queued",
      className: "bg-muted text-muted-foreground border-muted-border",
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      className: "bg-warning/10 text-warning border-warning/20",
      animate: true,
    },
    completed: {
      icon: CheckCircle2,
      label: "Complete",
      className: "bg-success/10 text-success border-success/20",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const { icon: Icon, label, className, animate } = config[status];

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-xs font-medium ${className}`}
      data-testid={`status-${status}`}
    >
      <Icon className={`w-3 h-3 ${animate ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
}
