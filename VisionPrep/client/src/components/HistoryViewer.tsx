import { useState, useEffect } from "react";
import { History, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlacementBadge } from "./PlacementBadge";
import { Badge } from "@/components/ui/badge";
import { getHistory, clearHistory, deleteHistoryEntry, type HistoryEntry } from "@/lib/historyStorage";
import { formatBytes } from "@/lib/utils";

export function HistoryViewer() {
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Refresh history on mount and when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setHistory(getHistory());
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", handleStorageChange);
    
    // Set up custom event for same-tab updates
    window.addEventListener("historyUpdated", handleStorageChange);

    // Initial load
    setHistory(getHistory());

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("historyUpdated", handleStorageChange);
    };
  }, []);

  const refreshHistory = () => {
    setHistory(getHistory());
  };

  const handleClearAll = () => {
    clearHistory();
    refreshHistory();
  };

  const handleDeleteEntry = (id: string) => {
    deleteHistoryEntry(id);
    refreshHistory();
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Processing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No processing history yet. Generated images will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Processing History
            <Badge variant="secondary" className="ml-2">
              {history.length}
            </Badge>
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" data-testid="button-clear-history">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Processing History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {history.length} processing history entries. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>Clear History</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((entry) => {
          const isExpanded = expandedIds.has(entry.id);
          const date = new Date(entry.timestamp);
          const formattedDate = date.toLocaleString();

          return (
            <div
              key={entry.id}
              className="border rounded-lg p-3 space-y-2"
              data-testid={`history-entry-${entry.id}`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="flex items-center gap-2 flex-1 text-left hover-elevate active-elevate-2 p-2 rounded-md"
                  data-testid={`button-toggle-${entry.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {entry.images.length} image{entry.images.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{formattedDate}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {entry.lang === "ja" ? "Japanese" : "English"}
                  </Badge>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteEntry(entry.id)}
                  data-testid={`button-delete-${entry.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {isExpanded && (
                <div className="pl-6 space-y-3 pt-2 border-t">
                  {entry.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 p-2 rounded-md bg-muted/30"
                      data-testid={`history-image-${idx}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono truncate text-foreground">
                            {img.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {img.metrics.width} × {img.metrics.height} • {formatBytes(img.metrics.bytes)}
                          </p>
                        </div>
                        {img.result && <PlacementBadge placement={img.result.placement_hint as any} />}
                      </div>

                      {img.result && (
                        <>
                          <p className="text-sm text-foreground">{img.result.alt}</p>
                          
                          {img.result.keywords_used.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {img.result.keywords_used.map((keyword) => (
                                <Badge key={keyword} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1">
                            {img.result.tags.slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {img.result.tags.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{img.result.tags.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
