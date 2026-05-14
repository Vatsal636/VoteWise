/**
 * @module lib/gemini
 * @description Core AI integration layer for VoteWise AI.
 *
 * This module provides all Gemini AI capabilities used across the platform:
 * - **Multi-turn conversational advisor** with Google Search grounding and SSE streaming
 * - **Impact simulation generator** with structured JSON output
 * - **Multimodal document scanner** via Gemini Vision for civic document analysis
 *
 * All functions enforce structured JSON output and support multilingual responses
 * based on the user's language preference stored in their profile.
 *
 * @see {@link https://ai.google.dev/gemini-api/docs} Gemini API Documentation
 */

import { GoogleGenerativeAI, Content } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// ── Types ──────────────────────────────────────────────────────────────────

/** A single actionable step in a voter's election plan. */
export type ElectionStep = {
  id: string;
  title: string;
  action: string;
  reasoning: string;
  confidence?: "Low" | "Medium" | "High";
  source?: string;
};

/** Structured response from the AI advisor containing advice and optional plan updates. */
export type AssistantResponse = {
  adviceSteps: ElectionStep[];
  suggestedPlanUpdate?: ElectionStep[] | null;
};

/** Structured response from the impact simulation containing participation scenarios. */
export type ImpactResponse = {
  participationScenario: { points: string[] };
  nonParticipationScenario: { points: string[] };
  futureSnapshot: { withParticipation: string; withoutParticipation: string };
  confidenceLevel: string;
};

/** Structured response from the document scanner with extracted information. */
export type ScannerResponse = {
  documentType: string;
  extractedInfo: Record<string, string>;
  missingFields: string[];
  nextSteps: ElectionStep[];
  summary: string;
};

/** User profile containing voter information and preferences. */
export type UserProfile = {
  ageGroup: string;
  isFirstTimeVoter: boolean | null;
  location: string;
  votingPlan?: ElectionStep[];
  language?: string;
};

// ── System Instructions ─────────────────────────────────────────────────────

const ADVISOR_SYSTEM_INSTRUCTION = `You are VoteWise AI, an intelligent, personal election coach and civic assistant.

Your role:
- Provide structured, actionable guidance for voters
- Help with voter registration, ID issues, relocation, first-time voting
- Use Google Search grounding to include real, factual, location-specific information when possible
- Be non-partisan — NEVER recommend specific parties or candidates
- Always explain WHY each step matters
- Remember conversation context — reference earlier messages when relevant

You MUST respond in valid JSON matching this schema:
{
  "adviceSteps": [
    {
      "id": "unique-string-id",
      "title": "Step Title",
      "action": "Clear action the user should take",
      "reasoning": "Why this step matters",
      "confidence": "High" | "Medium" | "Low",
      "source": "Official source or reference"
    }
  ],
  "suggestedPlanUpdate": null
}

Rules for suggestedPlanUpdate:
- Only suggest if the user's situation requires updating their voting plan (e.g., lost ID, moved)
- PRESERVE existing plan steps and their exact "id" strings
- Append or insert new relevant steps
- If no update needed, set to null`;

// ── Advisor Model (Chat + Grounding + Streaming) ──────────────────────────

/**
 * Returns a configured Gemini 2.5 Flash model instance for the civic advisor.
 * Includes Google Search grounding for real-time factual data.
 */
function getAdvisorModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
    // @ts-expect-error - googleSearch is the correct tool name for Gemini 2.5 but is not yet in the @google/generative-ai 0.24.x type definitions
    tools: [{ googleSearch: {} }]
  });
}

/**
 * Streams election advice from the Gemini AI advisor using Server-Sent Events.
 *
 * This function implements multi-turn chat with full conversation history,
 * Google Search grounding for factual accuracy, and token-by-token streaming
 * for reduced perceived latency.
 *
 * @param query - The user's election-related question.
 * @param userProfile - The user's civic profile (age, location, voter status).
 * @param chatHistory - Previous conversation messages for multi-turn context.
 * @yields Chunks of the AI response as they are generated.
 */
export async function* streamElectionAdvice(
  query: string,
  userProfile: UserProfile,
  chatHistory: Content[]
): AsyncGenerator<string> {
  if (!apiKey) {
    yield JSON.stringify({
      adviceSteps: [{
        id: "error-no-api",
        title: "API Key Missing",
        action: "Please configure your GEMINI_API_KEY in the environment.",
        reasoning: "The AI assistant cannot generate personalized advice without API access.",
        confidence: "High",
      }],
    });
    return;
  }

  const model = getAdvisorModel();
  const lang = userProfile.language || "English";

  const chat = model.startChat({ history: chatHistory });

  const contextualPrompt = `
User Profile:
- Age Group: ${userProfile.ageGroup || "Unknown"}
- First-time voter: ${userProfile.isFirstTimeVoter === true ? "Yes" : userProfile.isFirstTimeVoter === false ? "No" : "Unknown"}
- Location: ${userProfile.location || "Unknown"}
- Preferred Language: ${lang}

Current Voting Plan:
${JSON.stringify(userProfile.votingPlan || [], null, 2)}

User's Question: "${query}"

Respond in ${lang}. Use grounded, factual information relevant to the user's location.

CRITICAL: You MUST respond EXCLUSIVELY with a JSON object inside a \`\`\`json markdown code block. Do NOT include any conversational text before or after the code block.`;

  try {
    const result = await chat.sendMessageStream(contextualPrompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } catch (error) {
    console.error("Streaming error:", error);
    yield JSON.stringify({
      adviceSteps: [{
        id: "error-stream",
        title: "Generation Error",
        action: "Please try asking your question again.",
        reasoning: "The assistant encountered an error while generating advice.",
        confidence: "High",
      }],
    });
  }
}

// ── Impact Simulator Model ────────────────────────────────────────────────

/**
 * Generates a civic impact simulation comparing voter participation vs non-participation.
 *
 * Uses Gemini's structured JSON output to produce illustrative (non-predictive)
 * scenarios tailored to the user's profile and selected policy issues.
 *
 * @param userProfile - The voter's civic profile.
 * @param selectedIssues - Policy issues the voter cares about (e.g., "education", "healthcare").
 * @returns A structured impact simulation with participation/non-participation scenarios.
 * @throws Error if the API key is missing or the Gemini API call fails.
 */
export async function generateImpactSimulation(
  userProfile: UserProfile,
  selectedIssues: string[]
): Promise<ImpactResponse> {
  if (!apiKey) throw new Error("API key missing");

  const lang = userProfile.language || "English";
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
You are a civic education AI. Generate an illustrative impact simulation for a voter.

Voter Profile:
- Age: ${userProfile.ageGroup || "Unknown"}
- First-time voter: ${userProfile.isFirstTimeVoter ? "Yes" : "No"}
- Location: ${userProfile.location || "Unknown"}
- Issues they care about: ${selectedIssues.join(", ")}

Generate a thoughtful, illustrative scenario comparing civic participation vs non-participation.
Focus specifically on the issues the voter selected. Be specific, educational, and neutral.

CRITICAL CONSTRAINTS:
- Do NOT predict actual election results
- Do NOT mention real political parties or candidates
- Do NOT generate fake statistics
- Keep language neutral, educational, and illustrative
- Label everything as a simulation

Respond in ${lang}.

Return JSON:
{
  "participationScenario": { "points": ["point1", "point2", "point3"] },
  "nonParticipationScenario": { "points": ["point1", "point2", "point3"] },
  "futureSnapshot": {
    "withParticipation": "A paragraph describing a positive illustrative future...",
    "withoutParticipation": "A paragraph describing a muted illustrative future..."
  },
  "confidenceLevel": "Illustrative"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

// ── Document Scanner Model (Multimodal) ───────────────────────────────────

/**
 * Analyzes a civic document image using Gemini Vision (multimodal AI).
 *
 * Accepts a base64-encoded image of a Voter ID, registration form, or election notice,
 * and returns extracted information, missing fields, and actionable next steps.
 *
 * @param imageBase64 - The base64-encoded image data (without the data URL prefix).
 * @param mimeType - The MIME type of the image (e.g., "image/jpeg", "image/png").
 * @param userProfile - The voter's civic profile for contextual analysis.
 * @returns Structured analysis with extracted data and recommended actions.
 * @throws Error if the API key is missing or the Gemini API call fails.
 */
export async function analyzeDocument(
  imageBase64: string,
  mimeType: string,
  userProfile: UserProfile
): Promise<ScannerResponse> {
  if (!apiKey) throw new Error("API key missing");

  const lang = userProfile.language || "English";
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are a civic document analysis assistant. Analyze this uploaded document image.

The user is a voter in ${userProfile.location || "India"}.

Tasks:
1. Identify the document type (e.g., Voter ID Card, Registration Form, Election Notice, Address Proof, etc.)
2. Extract all visible information (names, IDs, dates, addresses, etc.)
3. Identify any missing or unclear fields
4. Provide actionable next steps based on what you see

Respond in ${lang}.

IMPORTANT: Do NOT fabricate information. Only extract what is clearly visible.

Return JSON:
{
  "documentType": "Voter ID Card",
  "extractedInfo": { "field1": "value1", "field2": "value2" },
  "missingFields": ["field that appears blank or missing"],
  "nextSteps": [
    { "id": "scan-step-1", "title": "...", "action": "...", "reasoning": "...", "confidence": "High", "source": "..." }
  ],
  "summary": "Brief summary of the document analysis"
}`;

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = result.response.text();
  return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}

// ── Legacy non-streaming function (fallback) ──────────────────────────────

/**
 * Non-streaming fallback for generating election advice.
 * Used when SSE streaming is not supported or needed.
 *
 * @param query - The user's election-related question.
 * @param userProfile - The user's civic profile.
 * @returns Structured advice response with action steps.
 */
export async function getElectionAdvice(
  query: string,
  userProfile: UserProfile
): Promise<AssistantResponse> {
  if (!apiKey) {
    return {
      adviceSteps: [{
        id: "error-no-api",
        title: "API Key Missing",
        action: "Please configure your GEMINI_API_KEY in the environment.",
        reasoning: "The AI assistant cannot generate personalized advice without API access.",
        confidence: "High",
      }],
    };
  }

  const model = getAdvisorModel();
  const result = await model.generateContent(`
User Profile:
- Age: ${userProfile.ageGroup || "Unknown"}
- First-time voter: ${userProfile.isFirstTimeVoter === true ? "Yes" : userProfile.isFirstTimeVoter === false ? "No" : "Unknown"}
- Location: ${userProfile.location || "Unknown"}

Current Voting Plan:
${JSON.stringify(userProfile.votingPlan || [], null, 2)}

User Query: "${query}"
`);

  const text = result.response.text();
  const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(jsonStr) as AssistantResponse;
}
