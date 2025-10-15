# AI Image Prep - Project Documentation

## Overview

An AI-powered web application that batch processes images to generate SEO-friendly ALT text, content tags, and smart placement hints for AI-driven page building. The tool uses OpenAI's vision model to analyze images and provide structured metadata optimized for web accessibility and search engines.

**Purpose:** Streamline image preparation for web developers by automating the creation of high-quality ALT text and placement recommendations.

**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- Backend: Node.js + Express
- AI: OpenAI GPT-4o-mini (via Replit AI Integrations)
- State Management: React Query
- File Processing: crypto-js, react-dropzone

## Recent Changes

### 2025-10-14: Initial MVP Implementation
- ✅ Complete schema definition with strict JSON validation
- ✅ Beautiful, responsive frontend with dark mode support
- ✅ Drag-and-drop image upload (max 10 images)
- ✅ Settings sidebar (language: ja/en, SEO keywords, tone selection)
- ✅ OpenAI vision API integration with retry logic (gpt-4o-mini)
- ✅ Concurrent batch processing (2-3 parallel requests)
- ✅ Real-time status tracking (queued → processing → completed/failed)
- ✅ CSV and JSON export functionality
- ✅ Per-image regeneration capability
- ✅ SHA256 duplicate detection (hashed from binary ArrayBuffer)
- ✅ Fixed OpenAI API parameter (max_tokens instead of max_completion_tokens)
- ✅ Fixed icon import (PanelLeft for sidebar placement hint)

## Project Architecture

### Frontend Structure
```
client/src/
├── components/
│   ├── ImageCard.tsx           # Individual image result card
│   ├── ImageDropzone.tsx       # File upload with drag-and-drop
│   ├── PlacementBadge.tsx      # Placement hint visualization
│   ├── SettingsSidebar.tsx     # Language/keywords/tone controls
│   ├── StatusBadge.tsx         # Processing status indicator
│   └── ThemeToggle.tsx         # Dark/light mode switcher
├── pages/
│   └── Home.tsx                # Main application page
├── lib/
│   └── utils.ts                # SHA256, metrics, download helpers
└── App.tsx                     # Root component with routing
```

### Backend Structure
```
server/
├── routes.ts                   # API endpoint (/api/generate)
├── openai.ts                   # OpenAI client initialization
└── lib/
    └── imageProcessor.ts       # Vision analysis + retry logic
```

### Data Flow
1. User uploads images → SHA256 hash + metrics extracted
2. User configures settings (language, keywords, tone)
3. Click "Generate" → batch sent to `/api/generate`
4. Backend processes 2-3 images concurrently with retry
5. OpenAI vision model analyzes each image
6. Results validated against strict schema
7. Frontend updates with results in real-time
8. User can copy ALT text, regenerate, or export CSV/JSON

## Key Features

### Image Analysis
- **ALT Text Generation:** SEO-optimized, max 120 chars (Japanese) / 140 chars (English)
- **Keyword Integration:** Naturally incorporates 0-2 user-provided SEO keywords
- **Content Tags:** Up to 10 descriptive tags per image
- **Placement Hints:** Smart recommendations (hero, feature, sidebar, gallery, etc.)

### Processing
- **Batch Limit:** 10 images per run
- **Concurrency:** 2-3 parallel requests to optimize speed
- **Retry Logic:** Exponential backoff with 2 retry attempts
- **Timeout Handling:** 30s per image with graceful failure

### Export Options
- **CSV:** All results with comma-separated keywords/tags
- **JSON:** Structured batch response with ISO timestamps
- Both formats include SHA256 hashes for duplicate tracking

## User Preferences

### Design System
- **Primary Color:** Vibrant blue (217 91% 60%)
- **Success/Warning/Error:** Green/Amber/Red semantic colors
- **Typography:** Inter (UI), JetBrains Mono (code/filenames)
- **Layout:** Clean, data-dense, minimal decoration
- **Theme:** Full dark mode support with localStorage persistence

### API Configuration
- **OpenAI Integration:** Uses Replit AI Integrations (no API key required)
- **Model:** gpt-4o-mini for vision analysis
- **Rate Limiting:** Handled via concurrent batch processing
- **Cost:** Billed to Replit credits

## Setup Instructions

### Development
```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

### Environment Variables
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Auto-configured by Replit
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Auto-configured by Replit

No manual API key setup required! The OpenAI integration is managed by Replit AI Integrations.

### Running the App
1. The workflow "Start application" runs `npm run dev`
2. Frontend: Vite dev server at port 5000
3. Backend: Express server integrated with Vite
4. Access at the Replit preview URL

## Validation & Error Handling

### Schema Validation
- Request: Zod validation for images, language, tone, keywords
- Response: Strict JSON schema enforcement
- Auto-trim ALT text if exceeds length limits
- Cap keywords_used to 2, tags to 10

### Error States
- File processing failures → inline error messages
- API errors → toast notifications with retry option
- Invalid JSON from AI → automatic retry with corrective prompt
- Network timeouts → exponential backoff retry logic

## Testing & Quality Assurance

### Unit Test Coverage (30 tests, all passing)
- ✅ SHA256 generation consistency and binary data handling
- ✅ Byte formatting with decimal precision
- ✅ History storage CRUD operations (save/load/clear/delete)
- ✅ Max 50 history entries enforcement
- ✅ Schema validation for all data structures
- ✅ Keyword/tag limits (max 2 keywords, max 10 tags)
- ✅ Language/tone/placement hint validation
- ✅ Image batch limits (min 1, max 10)
- ✅ CSV/JSON export format validation

**Known Schema Limitation Found by Tests:**
- ALT text schema doesn't enforce 140 char limit or require non-empty strings
- Length validation happens in imageProcessor.ts during AI response trimming
- Future: Consider adding schema-level validation for ALT text constraints

### Phase 2 Features Completed
- ✅ Skip duplicate SHA256 files toggle (auto-detects processed images)
- ✅ Language regeneration toggle (regenerate all in new language)
- ✅ Optimized dimension extraction (already using Promise.all)
- ✅ Unit tests for schema validation and edge cases
- ✅ Batch processing history with localStorage

## Future Enhancements

Potential features for next phase:
- [ ] Add ALT text length validation to schema (140 chars, non-empty)
- [ ] Persist skip duplicates preference to localStorage
- [ ] Export history as CSV/JSON
- [ ] Custom placement hint categories
- [ ] Multi-language support beyond ja/en
- [ ] Batch regeneration with different tone settings

## Technical Notes

### Image Processing
- SHA256 computed from binary ArrayBuffer (not base64) for accurate duplicate detection
- Metrics extracted via Image() API
- File size from File.size property
- All processing client-side before API call

### Concurrency Implementation
- `processBatchWithConcurrency()` manages parallel execution
- Uses Promise.race() for slot-based concurrency
- Maintains order in results array
- Graceful handling of individual failures

### Frontend Performance
- React Query for efficient caching
- Optimistic UI updates during processing
- Progress bar tracks completion percentage
- Status badges with animated loading states

---

**Last Updated:** 2025-10-14  
**Project Status:** MVP Complete, Ready for Testing
