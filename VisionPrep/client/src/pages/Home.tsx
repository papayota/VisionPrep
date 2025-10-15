import { useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ImageCard } from "@/components/ImageCard";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { HistoryViewer } from "@/components/HistoryViewer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles, Download, FileJson, X, Loader2 } from "lucide-react";
import { calculateSHA256, getImageMetrics, fileToDataUrl, downloadCSV, downloadJSON } from "@/lib/utils";
import { saveToHistory, getProcessedSHA256s } from "@/lib/historyStorage";
import type { ProcessingImage, Language, Tone } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [images, setImages] = useState<ProcessingImage[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<Tone>("neutral");
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedLanguage, setLastProcessedLanguage] = useState<Language | null>(null);
  const { toast } = useToast();

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newImages: ProcessingImage[] = [];
    const processedSHA256s = skipDuplicates ? getProcessedSHA256s() : new Set<string>();
    let skippedCount = 0;

    for (const file of files) {
      try {
        const [sha256, metrics, dataUrl] = await Promise.all([
          calculateSHA256(file),
          getImageMetrics(file),
          fileToDataUrl(file),
        ]);

        // Check if already processed and skip if enabled
        if (skipDuplicates && processedSHA256s.has(sha256)) {
          skippedCount++;
          continue;
        }

        newImages.push({
          id: nanoid(),
          file,
          dataUrl,
          sha256,
          metrics,
          status: "queued",
        });
      } catch (error) {
        toast({
          title: "Error processing file",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (skippedCount > 0) {
      toast({
        title: "Duplicates skipped",
        description: `${skippedCount} image${skippedCount === 1 ? " was" : "s were"} already processed`,
      });
    }

    setImages((prev) => [...prev, ...newImages]);
  }, [toast, skipDuplicates]);

  const handleGenerate = async () => {
    const queuedImages = images.filter(
      (img) => img.status === "queued" || img.status === "failed"
    );
    
    if (queuedImages.length === 0) {
      toast({
        title: "No images to process",
        description: "Please add images or regenerate failed ones",
      });
      return;
    }

    setIsProcessing(true);

    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const requestData = {
      images: queuedImages.map((img) => ({
        dataUrl: img.dataUrl,
        filename: img.file.name,
        sha256: img.sha256,
        metrics: img.metrics,
      })),
      lang: language,
      tone: tone === "neutral" ? undefined : tone,
      keywords: keywordList.length > 0 ? keywordList : undefined,
    };

    queuedImages.forEach((img) => {
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: "processing" as const } : i))
      );
    });

    try {
      const response: any = await apiRequest("POST", "/api/generate", requestData);

      // Update all images with results
      const updatedImages: ProcessingImage[] = [];
      setImages((prev) => {
        const next = prev.map((img) => {
          const item = response.items.find((i: any) => i.sha256 === img.sha256);
          if (item) {
            const updated = {
              ...img,
              status: "completed" as const,
              result: item.result,
            };
            updatedImages.push(updated);
            return updated;
          }
          return img;
        });
        return next;
      });

      // Save completed images to history
      saveToHistory(updatedImages, language);
      
      // Track the language used for processing
      setLastProcessedLanguage(language);

      toast({
        title: "Processing complete",
        description: `Successfully processed ${response.items.length} image${response.items.length === 1 ? "" : "s"}`,
      });
    } catch (error: any) {
      queuedImages.forEach((img) => {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? {
                  ...i,
                  status: "failed" as const,
                  error: error.message || "Processing failed",
                }
              : i
          )
        );
      });

      toast({
        title: "Processing failed",
        description: error.message || "An error occurred during processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = async (imageId: string) => {
    const image = images.find((img) => img.id === imageId);
    if (!image) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "processing" as const, error: undefined } : img
      )
    );

    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const requestData = {
      images: [
        {
          dataUrl: image.dataUrl,
          filename: image.file.name,
          sha256: image.sha256,
          metrics: image.metrics,
        },
      ],
      lang: language,
      tone: tone === "neutral" ? undefined : tone,
      keywords: keywordList.length > 0 ? keywordList : undefined,
    };

    try {
      const response: any = await apiRequest("POST", "/api/generate", requestData);

      if (response.items && response.items.length > 0) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  status: "completed" as const,
                  result: response.items[0].result,
                }
              : img
          )
        );

        toast({
          title: "Regeneration complete",
          description: "Image has been reprocessed successfully",
        });
      }
    } catch (error: any) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                status: "failed" as const,
                error: error.message || "Regeneration failed",
              }
            : img
        )
      );

      toast({
        title: "Regeneration failed",
        description: error.message || "An error occurred during regeneration",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    setImages([]);
    setLastProcessedLanguage(null);
  };

  const handleRegenerateAll = async () => {
    const completedImages = images.filter((img) => img.status === "completed");
    
    if (completedImages.length === 0) {
      toast({
        title: "No images to regenerate",
        description: "Please process some images first",
      });
      return;
    }

    setIsProcessing(true);

    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const requestData = {
      images: completedImages.map((img) => ({
        dataUrl: img.dataUrl,
        filename: img.file.name,
        sha256: img.sha256,
        metrics: img.metrics,
      })),
      lang: language,
      tone: tone === "neutral" ? undefined : tone,
      keywords: keywordList.length > 0 ? keywordList : undefined,
    };

    // Mark all completed images as processing
    completedImages.forEach((img) => {
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: "processing" as const } : i))
      );
    });

    try {
      const response: any = await apiRequest("POST", "/api/generate", requestData);

      // Update all images with new results
      const updatedImages: ProcessingImage[] = [];
      setImages((prev) => {
        const next = prev.map((img) => {
          const item = response.items.find((i: any) => i.sha256 === img.sha256);
          if (item) {
            const updated = {
              ...img,
              status: "completed" as const,
              result: item.result,
            };
            updatedImages.push(updated);
            return updated;
          }
          return img;
        });
        return next;
      });

      // Save to history with new language
      saveToHistory(updatedImages, language);
      setLastProcessedLanguage(language);

      toast({
        title: "Regeneration complete",
        description: `Regenerated ${response.items.length} image${response.items.length === 1 ? "" : "s"} in ${language === "ja" ? "Japanese" : "English"}`,
      });
    } catch (error: any) {
      completedImages.forEach((img) => {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? { ...i, status: "failed" as const, error: error.message }
              : i
          )
        );
      });

      toast({
        title: "Regeneration failed",
        description: error.message || "An error occurred during regeneration",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCSV = () => {
    downloadCSV(images, language);
    toast({
      title: "CSV downloaded",
      description: "Image analysis data has been exported",
    });
  };

  const handleDownloadJSON = () => {
    const jsonData = {
      generated_at: new Date().toISOString(),
      lang: language,
      items: images
        .filter((img) => img.result)
        .map((img) => ({
          filename: img.file.name,
          sha256: img.sha256,
          metrics: img.metrics,
          result: img.result,
        })),
    };

    downloadJSON(jsonData, `image-analysis-${new Date().toISOString().split("T")[0]}.json`);
    toast({
      title: "JSON downloaded",
      description: "Image analysis data has been exported",
    });
  };

  const completedCount = images.filter((img) => img.status === "completed").length;
  const processingCount = images.filter((img) => img.status === "processing").length;
  const progressPercentage = images.length > 0 ? (completedCount / images.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  AI Image Prep
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  SEO-optimized ALT text & placement hints
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-6 py-8">
        <div className="grid lg:grid-cols-[320px,1fr] gap-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-6">
                <SettingsSidebar
                  language={language}
                  onLanguageChange={setLanguage}
                  keywords={keywords}
                  onKeywordsChange={setKeywords}
                  tone={tone}
                  onToneChange={setTone}
                  skipDuplicates={skipDuplicates}
                  onSkipDuplicatesChange={setSkipDuplicates}
                />
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-6">
            <ImageDropzone
              onFilesAdded={handleFilesAdded}
              currentCount={images.length}
              maxImages={10}
            />

            {images.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-foreground">
                        Processing Progress
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid="text-progress">
                        {completedCount}/{images.length}
                      </p>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={isProcessing || images.every((img) => img.status === "completed")}
                    className="gap-2"
                    data-testid="button-generate"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleClearAll}
                    disabled={isProcessing}
                    className="gap-2"
                    data-testid="button-clear"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </Button>

                  {completedCount > 0 && lastProcessedLanguage && lastProcessedLanguage !== language && (
                    <Button
                      onClick={handleRegenerateAll}
                      disabled={isProcessing}
                      variant="default"
                      className="gap-2"
                      data-testid="button-regenerate-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      Regenerate All ({language === "ja" ? "Japanese" : "English"})
                    </Button>
                  )}

                  {completedCount > 0 && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleDownloadCSV}
                        className="gap-2"
                        data-testid="button-download-csv"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleDownloadJSON}
                        className="gap-2"
                        data-testid="button-download-json"
                      >
                        <FileJson className="w-4 h-4" />
                        Download JSON
                      </Button>
                    </>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onRegenerate={handleRegenerate}
                      isProcessing={isProcessing}
                    />
                  ))}
                </div>
              </>
            )}

            <HistoryViewer />
          </main>
        </div>
      </div>
    </div>
  );
}
