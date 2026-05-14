# VoteWise AI — Architecture & Google Services Integration

## System Overview

VoteWise AI is a production-grade civic intelligence platform built on **Google Gemini 2.5 Flash**. The architecture deeply integrates 5 distinct Gemini capabilities across 4 user-facing modules, going far beyond simple API wrappers.

## Feature → Gemini Capability Mapping

| Feature | API Endpoint | Gemini Capability | Integration Depth |
|---|---|---|---|
| **AI Assistant** | `/api/advice` | Multi-turn Chat (`startChat`) + Google Search Grounding (`googleSearch`) + SSE Streaming (`sendMessageStream`) | Deep — maintains conversation history, streams tokens, grounds in live web data |
| **Impact Simulator** | `/api/impact` | Structured JSON Output (`responseMimeType: "application/json"`) | Deep — generates entire scenarios dynamically from user profile + issues |
| **Document Scanner** | `/api/scanner` | Multimodal Vision (`inlineData` with base64 image) | Deep — analyzes real civic documents, extracts data, generates next steps |
| **Multilingual Support** | All endpoints | Language-adapted system prompts | Cross-cutting — all AI responses adapt to user's preferred language |

## Google Cloud Services

| Service | Purpose |
|---|---|
| **Google Cloud Run** | Production hosting with auto-scaling, zero cold-start containers |
| **Google Cloud Build** | CI/CD pipeline triggered by `gcloud run deploy --source` |
| **Gemini 2.5 Flash API** | Core AI engine for all intelligent features |
| **Google Search Grounding** | Real-time factual data for location-specific civic advice |

## API Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
├──────────────┬──────────────┬────────────────────────────┤
│  /api/advice │  /api/impact │  /api/scanner              │
│  (SSE Stream)│  (JSON)      │  (Multimodal JSON)         │
├──────────────┴──────────────┴────────────────────────────┤
│              src/lib/validation.ts (Zod)                  │
│              Input validation + structured responses      │
├──────────────────────────────────────────────────────────┤
│              src/lib/gemini.ts                            │
│              Gemini SDK integration layer                 │
│  ┌──────────┬──────────────┬───────────────────────┐     │
│  │ startChat│generateContent│ generateContent       │     │
│  │ +stream  │ +JSON schema  │ +inlineData (vision)  │     │
│  └──────────┴──────────────┴───────────────────────┘     │
├──────────────────────────────────────────────────────────┤
│          @google/generative-ai SDK (v0.24.1)             │
│          Gemini 2.5 Flash API (v1beta)                   │
└──────────────────────────────────────────────────────────┘
```

## Security Architecture

- **Input Validation:** All API routes validate payloads using Zod schemas before processing
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy
- **File Upload Protection:** Scanner validates MIME type (JPEG/PNG/WebP/GIF only) and file size (max 10MB)
- **API Key Management:** Server-side only via environment variables; never exposed to client
- **Structured Error Handling:** All API responses follow `{ success, data?, error? }` format

## Performance Strategy

- **SSE Streaming:** Token-by-token response delivery reduces perceived latency from ~5s to instant
- **Multi-turn Chat:** `startChat()` maintains context, avoiding redundant prompt processing
- **Next.js App Router:** Automatic code splitting, server-side rendering, and static generation
- **Standalone Output:** Optimized Docker container for Cloud Run with minimal image size
