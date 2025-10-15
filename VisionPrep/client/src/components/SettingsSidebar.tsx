import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { Language, Tone } from "@shared/schema";

interface SettingsSidebarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  keywords: string;
  onKeywordsChange: (keywords: string) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (skip: boolean) => void;
}

export function SettingsSidebar({
  language,
  onLanguageChange,
  keywords,
  onKeywordsChange,
  tone,
  onToneChange,
  skipDuplicates,
  onSkipDuplicatesChange,
}: SettingsSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Processing Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure how images are analyzed
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Language</Label>
          <RadioGroup
            value={language}
            onValueChange={(val) => onLanguageChange(val as Language)}
            data-testid="radio-language"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="lang-en" data-testid="radio-en" />
              <Label htmlFor="lang-en" className="cursor-pointer font-normal">
                English (max 140 chars)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ja" id="lang-ja" data-testid="radio-ja" />
              <Label htmlFor="lang-ja" className="cursor-pointer font-normal">
                Japanese (max 120 chars)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="keywords" className="text-sm font-medium">
              SEO Keywords
            </Label>
            <p className="text-xs text-muted-foreground">
              Comma-separated, used when natural (0-2 max)
            </p>
          </div>
          <Textarea
            id="keywords"
            placeholder="web design, modern UI, responsive"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            className="font-mono text-sm resize-none"
            rows={3}
            data-testid="textarea-keywords"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Tone</Label>
          <RadioGroup
            value={tone}
            onValueChange={(val) => onToneChange(val as Tone)}
            data-testid="radio-tone"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="neutral"
                id="tone-neutral"
                data-testid="radio-neutral"
              />
              <Label
                htmlFor="tone-neutral"
                className="cursor-pointer font-normal"
              >
                Neutral
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="friendly"
                id="tone-friendly"
                data-testid="radio-friendly"
              />
              <Label
                htmlFor="tone-friendly"
                className="cursor-pointer font-normal"
              >
                Friendly
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="professional"
                id="tone-professional"
                data-testid="radio-professional"
              />
              <Label
                htmlFor="tone-professional"
                className="cursor-pointer font-normal"
              >
                Professional
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="skip-duplicates" className="text-sm font-medium">
                Skip Duplicates
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically skip previously processed images
              </p>
            </div>
            <Switch
              id="skip-duplicates"
              checked={skipDuplicates}
              onCheckedChange={onSkipDuplicatesChange}
              data-testid="switch-skip-duplicates"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
