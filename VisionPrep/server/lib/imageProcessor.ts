import { openai } from "../openai";
import type { Language, Tone, ImageResult } from "@shared/schema";
import { imageResultSchema } from "@shared/schema";

interface ProcessImageParams {
  dataUrl: string;
  filename: string;
  lang: Language;
  tone?: Tone;
  keywords?: string[];
}

const SYSTEM_PROMPT = `You generate SEO-friendly ALT text and layout hints from images. Return STRICT JSON only that conforms to the given schema. Avoid uncertain guesses (no private attributes). Use user-provided keywords only when natural.`;

function buildUserPrompt(params: ProcessImageParams): string {
  const { lang, tone, keywords, filename } = params;
  
  const maxChars = lang === "ja" ? 120 : 140;
  const toneInstruction = tone ? `Tone: ${tone}. ` : "";
  const keywordsInstruction = keywords && keywords.length > 0
    ? `SEO keywords (use 0-2 if they fit naturally): ${keywords.join(", ")}. `
    : "";

  return `Analyze this image (filename: ${filename}) and generate:

Language: ${lang}
${toneInstruction}${keywordsInstruction}

Return STRICT JSON with this structure:
{
  "alt": "SEO-friendly ALT text (max ${maxChars} chars for ${lang})",
  "keywords_used": ["keyword1", "keyword2"],  // 0-2 from provided keywords, ONLY if natural
  "tags": ["tag1", "tag2", ...],  // up to 10 content tags
  "placement_hint": "hero" | "how-it-works" | "feature" | "sidebar" | "cta-near" | "gallery"
}

placement_hint must be exactly one of: hero, how-it-works, feature, sidebar, cta-near, gallery
keywords_used must contain 0-2 items from the provided keywords list ONLY when they fit naturally
tags must be up to 10 descriptive content tags
alt must be concise and under ${maxChars} characters`;
}

function trimAltText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const trimmed = text.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  
  if (lastSpace > maxLength * 0.8) {
    return trimmed.substring(0, lastSpace);
  }
  
  return trimmed;
}

export async function processImageWithRetry(
  params: ProcessImageParams,
  maxRetries: number = 2
): Promise<ImageResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await processImage(params, attempt > 0);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Failed to process image");
}

async function processImage(
  params: ProcessImageParams,
  isRetry: boolean = false
): Promise<ImageResult> {
  const { dataUrl, lang } = params;
  const maxChars = lang === "ja" ? 120 : 140;
  
  const userPrompt = isRetry
    ? buildUserPrompt(params) + "\n\nIMPORTANT: Return ONLY valid JSON, no additional text."
    : buildUserPrompt(params);

  // Using gpt-4o-mini as it supports vision
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error("Invalid JSON response from AI model");
  }

  const validated = imageResultSchema.parse(parsed);

  if (validated.alt.length > maxChars) {
    validated.alt = trimAltText(validated.alt, maxChars);
  }

  if (validated.keywords_used.length > 2) {
    validated.keywords_used = validated.keywords_used.slice(0, 2);
  }

  if (validated.tags.length > 10) {
    validated.tags = validated.tags.slice(0, 10);
  }

  return validated;
}

export async function processBatchWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 3
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
