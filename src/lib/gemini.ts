import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

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

export async function getElectionAdvice(
  query: string,
  userProfile: { ageGroup: string; isFirstTimeVoter: boolean | null; location: string; votingPlan?: ElectionStep[] }
): Promise<AssistantResponse> {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Returning fallback data.");
    return {
      adviceSteps: [
        {
          id: "error-no-api",
          title: "API Key Missing",
          action: "Please configure your GEMINI_API_KEY in the environment.",
          reasoning: "The AI assistant cannot generate personalized advice without API access.",
          confidence: "High",
        },
      ]
    };
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `
You are VoteWise AI, an intelligent, personal election coach.
User Profile:
- Age: ${userProfile.ageGroup || "Unknown"}
- First-time voter: ${userProfile.isFirstTimeVoter === true ? "Yes" : userProfile.isFirstTimeVoter === false ? "No" : "Unknown"}
- Location: ${userProfile.location || "Unknown"}

Current Voting Plan:
${JSON.stringify(userProfile.votingPlan || [], null, 2)}

User Query: "${query}"

Instructions:
1. "adviceSteps": Provide direct advice addressing the query.
2. "suggestedPlanUpdate": If the user's query changes their situation (e.g., lost ID, moved), suggest an updated Voting Plan. 
   - DO NOT silently overwrite! Append or insert the new relevant steps.
   - PRESERVE existing steps and their exact "id" strings.
   - If no plan update is needed, set "suggestedPlanUpdate" to null.
3. Every step must have a unique "id" (string), "title", "action", "reasoning", "confidence" ("Low", "Medium", "High"), and optionally a "source" (e.g., "Official Election Guidelines").

Return strictly a valid JSON object matching this schema:
{
  "adviceSteps": [
    { "id": "...", "title": "...", "action": "...", "reasoning": "...", "confidence": "High", "source": "..." }
  ],
  "suggestedPlanUpdate": null // OR an array of the updated ElectionStep objects
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed as AssistantResponse;
    } catch (parseError) {
      console.warn("Failed to parse Gemini JSON:", parseError);
      return {
        adviceSteps: [
          {
            id: "error-parse",
            title: "AI Response Error",
            action: "Please try asking your question again.",
            reasoning: "The assistant returned an improperly formatted response.",
            confidence: "High"
          }
        ]
      };
    }
  } catch (error) {
    console.error("Error generating advice:", error);
    throw new Error("Failed to get advice from VoteWise AI.");
  }
}
