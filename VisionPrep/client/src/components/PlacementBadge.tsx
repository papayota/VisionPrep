import { Badge } from "@/components/ui/badge";
import {
  Image,
  List,
  Star,
  PanelLeft,
  Target,
  Grid3x3,
} from "lucide-react";
import type { PlacementHint } from "@shared/schema";

interface PlacementBadgeProps {
  placement: PlacementHint;
}

export function PlacementBadge({ placement }: PlacementBadgeProps) {
  const config: Record<
    PlacementHint,
    { icon: any; label: string; className: string }
  > = {
    hero: {
      icon: Image,
      label: "Hero",
      className: "bg-primary/10 text-primary border-primary/20",
    },
    "how-it-works": {
      icon: List,
      label: "How It Works",
      className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    },
    feature: {
      icon: Star,
      label: "Feature",
      className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    },
    sidebar: {
      icon: PanelLeft,
      label: "Sidebar",
      className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    },
    "cta-near": {
      icon: Target,
      label: "CTA Near",
      className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    },
    gallery: {
      icon: Grid3x3,
      label: "Gallery",
      className: "bg-accent/50 text-accent-foreground border-accent-border",
    },
  };

  const { icon: Icon, label, className } = config[placement];

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${className}`}
      data-testid={`placement-${placement}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  );
}
