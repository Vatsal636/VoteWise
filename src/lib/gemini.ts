import { GoogleGenerativeAI, Content } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// ── Types ──────────────────────────────────────────────────────────────────

export type ElectionStep = {
  id: string;
  title: string;
  action: string;
  reasoning: string;
  confidence?: "Low" | "Medium" | "High";
  source?: string;
};

export type AssistantResponse = {
  adviceSteps: ElectionStep[];
  suggestedPlanUpdate?: ElectionStep[] | null;
};

export type ImpactResponse = {
  participationScenario: { points: string[] };
  nonParticipationScenario: { points: string[] };
  futureSnapshot: { withParticipation: string; withoutParticipation: string };
  confidenceLevel: string;
};

export type ScannerResponse = {
  documentType: string;
  extractedInfo: Record<string, string>;
  missingFields: string[];
  nextSteps: ElectionStep[];
  summary: string;
};

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

function getAdvisorModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
    // @ts-ignore - The googleSearch tool name is required by Gemini 2.5 API but missing in the 0.24.1 SDK types
    tools: [{ googleSearch: {} }]
  });
}

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

Respond in ${lang}. Use grounded, factual information relevant to the user's location.`;

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
