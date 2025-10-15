import OpenAI from "openai";

// This is using Replit's AI Integrations service per blueprint:javascript_openai_ai_integrations
// It provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Charges are billed to your Replit credits.
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});
