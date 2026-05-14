# VoteWise AI

An AI-powered civic intelligence platform that makes voter participation simple, personalized, and meaningful. Built with **Next.js 16**, **TypeScript**, and **Google Gemini 2.5 Flash**.

> **Live Demo:** [https://votewise-ai-531094927948.us-central1.run.app](https://votewise-ai-531094927948.us-central1.run.app)

## Features

### 🧠 AI Civic Assistant
Multi-turn conversational AI with **Google Search grounding** for real-time, location-specific civic guidance. Supports voice input via Web Speech API.

### 📊 Impact Simulator
AI-generated participation vs non-participation scenarios tailored to the user's profile and policy interests. Zero hardcoded content — fully dynamic.

### 📸 Document Scanner
**Gemini Vision** (multimodal) analyzes photos of voter IDs, registration forms, and election notices. Extracts data, identifies missing fields, and generates actionable next steps.

### 🌍 Multilingual Support
AI responses adapt to the user's preferred language (English, Hindi, Tamil, Bengali, Telugu, Marathi).

### 🗺️ Voting Journey Tracker
Personalized step-by-step voting plan with progress tracking and next-action guidance.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| AI Engine | Google Gemini 2.5 Flash |
| Validation | Zod (schema-based input validation) |
| Hosting | Google Cloud Run |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |

## Google Services Integration

See [architecture.md](./architecture.md) for the complete Feature → Gemini Capability mapping.

- **Gemini Multi-turn Chat** — Conversational memory with `startChat()`
- **Google Search Grounding** — Real-time factual civic data
- **Gemini Vision** — Multimodal document analysis
- **Structured JSON Output** — Reliable parsing via `responseMimeType`
- **SSE Streaming** — Token-by-token response delivery
- **Google Cloud Run** — Production deployment with auto-scaling

## Performance Optimizations

- **Streaming responses** reduce perceived latency from ~5 seconds to instant visual feedback
- **Multi-turn chat** avoids repeated context processing by maintaining session history
- **Next.js automatic code splitting** ensures minimal client-side bundle size per route
- **Standalone Docker output** optimized for Cloud Run with minimal container image size
- **Server-side API routes** keep AI processing off the client, reducing bundle weight

## Security

- Zod schema validation on all API inputs (type, size, format)
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- API keys server-side only (environment variables, never client-exposed)
- File upload protection: MIME type whitelist + 10MB size limit
- Structured error responses: `{ success, data?, error? }` format

## Testing

```bash
npm test        # Run Jest test suite
npm run lint    # Run ESLint
npm run build   # TypeScript type-check + production build
```

## Development

```bash
npm install     # Install dependencies
npm run dev     # Start development server at http://localhost:3000
```

## Deployment

```bash
gcloud run deploy votewise-ai --source . --region us-central1 --allow-unauthenticated
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── advice/route.ts    # SSE streaming AI advisor
│   │   ├── impact/route.ts    # Impact simulation generator
│   │   └── scanner/route.ts   # Multimodal document analyzer
│   ├── assistant/page.tsx     # AI chat interface
│   ├── impact/page.tsx        # Impact simulator UI
│   ├── scanner/page.tsx       # Document scanner UI
│   ├── guide/page.tsx         # Onboarding + dashboard
│   ├── journey/page.tsx       # Voting plan tracker
│   └── timeline/page.tsx      # Election timeline
├── lib/
│   ├── gemini.ts              # Gemini SDK integration (all AI functions)
│   └── validation.ts          # Zod schemas + response helpers
├── hooks/
│   ├── useSpeechRecognition.ts  # Web Speech API (voice input)
│   └── useSpeechSynthesis.ts    # SpeechSynthesis API (text-to-speech)
├── context/
│   └── UserContext.tsx          # Global user profile state
└── components/
    ├── layout/                  # Navbar, Footer
    ├── ui/                      # Button, Card, Input
    └── assistant/               # Voice controls
```

## License

Built for the **Build with AI Hackathon** by Google Developers × Hack2skill.
