import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PlacementBadge } from "./PlacementBadge";
import { formatBytes } from "@/lib/utils";
import type { ProcessingImage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ImageCardProps {
  image: ProcessingImage;
  onRegenerate: (imageId: string) => void;
  isProcessing: boolean;
}

export function ImageCard({ image, onRegenerate, isProcessing }: ImageCardProps) {
  const { toast } = useToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "ALT text has been copied",
      duration: 2000,
    });
  };

  return (
    <Card className="overflow-hidden" data-testid={`card-image-${image.id}`}>
      <div className="relative aspect-video bg-muted">
        <img
          src={image.dataUrl}
          alt={image.file.name}
          className="w-full h-full object-cover"
          data-testid={`img-thumbnail-${image.id}`}
        />
        <div className="absolute top-2 right-2">
          <StatusBadge status={image.status} />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <p
            className="text-sm font-mono truncate text-foreground"
            title={image.file.name}
            data-testid={`text-filename-${image.id}`}
          >
            {image.file.name}
          </p>
          <p className="text-xs text-muted-foreground" data-testid={`text-dimensions-${image.id}`}>
            {image.metrics.width} × {image.metrics.height} •{" "}
            {formatBytes(image.metrics.bytes)}
          </p>
        </div>

        {image.error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive" data-testid={`text-error-${image.id}`}>
              {image.error}
            </p>
          </div>
        )}

        {image.result && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  ALT Text
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(image.result!.alt)}
                  className="h-7 text-xs"
                  data-testid={`button-copy-${image.id}`}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <p
                className="text-sm text-foreground leading-relaxed"
                data-testid={`text-alt-${image.id}`}
              >
                {image.result.alt}
              </p>
            </div>

            {image.result.keywords_used.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Keywords Used
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {image.result.keywords_used.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="text-xs"
                      data-testid={`badge-keyword-${keyword}`}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {image.result.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs"
                    data-testid={`badge-tag-${tag}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Placement Hint
              </p>
              <PlacementBadge placement={image.result.placement_hint} />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerate(image.id)}
              disabled={isProcessing}
              className="w-full"
              data-testid={`button-regenerate-${image.id}`}
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
