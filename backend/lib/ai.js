import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: safely extract JSON from LLM output
const extractJsonFromText = (text) => {
  if (!text) return null;

  let cleaned = text.trim();

  const fencedMatch =
    cleaned.match(/```json([\s\S]*?)```/i) || cleaned.match(/```([\s\S]*?)```/);

  if (fencedMatch && fencedMatch[1]) cleaned = fencedMatch[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parse failed. Cleaned was:", cleaned.slice(0, 1500));
    return null;
  }
};

const RETRY_SIGNAL = "PERSONA_PARSE_FAILED";

const markdownFallbackToPersona = (text, payload) => ({
  ok: false,
  code: RETRY_SIGNAL,
  message:
    "We couldn't parse a valid JSON persona from the model output. Please reload to try again.",
  raw: payload,
  _raw_text: text?.slice(0, 8000),
});

export const generatePersonaFromData = async (payload) => {
  // ✅ pull context from payload if present
  const userContext = (payload?.userContext || payload?.context || "").trim();

  // ✅ keep raw exactly as sent (you asked the model to do this too)
  // (We still send the payload, but also we’ll enforce in instructions.)
  const payloadJson = JSON.stringify(payload, null, 2);

  // ✅ IMPORTANT: fix the JSON template (quotes + commas)
  const jsonTemplate = `{
  "name": "",
  "summary": "",
  "raw": {},
  "extracted_insights": {
    "key_themes": [],
    "audience_patterns": [],
    "emotional_signals": [],
    "opportunities": [],
    "contradictions": []
  },
  "emotional_profile": {
    "key_emotional_drivers": [],
    "core_values": [],
    "core_motivations": [],
    "emotional_barriers": [],
    "decision_triggers": []
  },
  "messaging_pillars": [
    {
      "id": "",
      "label": "",
      "description": "",
      "emotional_focus": [],
      "values_anchor": [],
      "inclusive_messaging_guidance": {
        "language_guidelines": [],
        "representation_notes": []
      },
      "example_messages": []
    }
  ],
  "accessibility_profile": {
    "accessibility_needs": [],
    "inclusion_considerations": [],
    "potential_barriers": {
      "content_barriers": [],
      "interaction_barriers": []
    },
    "accessibility_recommendations": {
      "structure": [],
      "language": [],
      "visual_and_interaction": []
    }
  },
  "engagement_strategy": {
    "access_need_guidance": [],
    "emotional_engagement": {
      "desired_emotions": [],
      "how_to_evokes_these_emotions": [],
      "emotional_triggers_to_avoid": []
    },
    "communication_strategy": {
      "tone": "",
      "format_recommendations": [],
      "language_guidance": [],
      "motivation_drivers": []
    },
    "barrier_resolution": {}
  },
  "model_framework": {
    "input_interpretation": {
      "primary_signals": [],
      "emotional_priority_order": [],
      "inclusion_priority_order": []
    },
    "output_generation": {
      "persona_rules": [],
      "messaging_rules": [],
      "accessibility_rules": []
    }
  }
}`;

  const prompt = `
ONLY RETURN VALID JSON.
- No markdown
- No explanation
- No code fences
- Output MUST be a single JSON object

ROLE:
You are MTJD's AI engine for research insight interpretation, audience analysis,
accessibility insight, and strategic communication design.

CRITICAL REQUIREMENTS:
1) Set "raw" to the INPUT PAYLOAD exactly (verbatim JSON object).
2) Return ALL keys exactly as in the template (use "", [], {} if unknown).
3) Use the USER CONTEXT (if provided) ONLY as guidance for emphasis/tone/priority.
   Do NOT invent facts that aren't supported by the document.
4) If the user context conflicts with the document, prioritise the document.

USER CONTEXT (optional guidance):
${userContext ? JSON.stringify(userContext) : "null"}

INPUT PAYLOAD:
${payloadJson}

OUTPUT JSON TEMPLATE (match keys exactly):
${jsonTemplate}
`;

  const generationConfig = {
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 8192, // ✅ reduce a bit to lower drift; adjust if you truly need huge outputs
    responseMimeType: "application/json",
  };

  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  });

  const text = result?.response?.text?.() ?? "";
  console.log("Gemini output preview:", text.slice(0, 400));

  const parsed = extractJsonFromText(text);
  if (parsed) return parsed;

  return markdownFallbackToPersona(text, payload);
};

// ------------------ Refine persona with chat prompt ------------------
export const refinePersonaWithPrompt = async ({ persona, prompt }) => {
  if (!persona || typeof persona !== "object") {
    throw new Error("persona is required and must be an object");
  }
  if (!prompt || typeof prompt !== "string") {
    throw new Error("prompt is required");
  }

  // Your system wants consistent JSON output.
  // We keep ALL keys and update values according to the user prompt.
  const jsonTemplate = `{
  "name": "",
  "summary": "",
  "raw": {},
  "extracted_insights": {
    "key_themes": [],
    "audience_patterns": [],
    "emotional_signals": [],
    "opportunities": [],
    "contradictions": []
  },
  "emotional_profile": {
    "key_emotional_drivers": [],
    "core_values": [],
    "core_motivations": [],
    "emotional_barriers": [],
    "decision_triggers": []
  },
  "messaging_pillars": [
    {
      "id": "",
      "label": "",
      "description": "",
      "emotional_focus": [],
      "values_anchor": [],
      "inclusive_messaging_guidance": {
        "language_guidelines": [],
        "representation_notes": []
      },
      "example_messages": []
    }
  ],
  "accessibility_profile": {
    "accessibility_needs": [],
    "inclusion_considerations": [],
    "potential_barriers": {
      "content_barriers": [],
      "interaction_barriers": []
    },
    "accessibility_recommendations": {
      "structure": [],
      "language": [],
      "visual_and_interaction": []
    }
  },
  "engagement_strategy": {
    "access_need_guidance": [],
    "emotional_engagement": {
      "desired_emotions": [],
      "how_to_evokes_these_emotions": [],
      "emotional_triggers_to_avoid": []
    },
    "communication_strategy": {
      "tone": "",
      "format_recommendations": [],
      "language_guidance": [],
      "motivation_drivers": []
    },
    "barrier_resolution": {}
  },
  "model_framework": {
    "input_interpretation": {
      "primary_signals": [],
      "emotional_priority_order": [],
      "inclusion_priority_order": []
    },
    "output_generation": {
      "persona_rules": [],
      "messaging_rules": [],
      "accessibility_rules": []
    }
  }
}`;

  const promptText = `
ONLY RETURN VALID JSON.
- No markdown
- No explanation
- No code fences
- Output MUST be a single JSON object

TASK:
You will refine/update the persona JSON based on the user's instruction.
Keep the overall structure and keys EXACTLY matching the template.
If a field is unknown, keep existing value (do NOT erase unless user explicitly requests removal).

RULES:
1) Start from CURRENT PERSONA JSON.
2) Apply USER PROMPT changes.
3) Preserve "raw" exactly as it already exists in CURRENT PERSONA (do not change raw unless user explicitly asks).
4) Return ALL keys exactly as in template.

USER PROMPT:
${prompt}

CURRENT PERSONA JSON:
${JSON.stringify(persona, null, 2)}

OUTPUT JSON TEMPLATE (keys must match exactly):
${jsonTemplate}
`;

  const generationConfig = {
    temperature: 0.3,
    topP: 0.9,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };

  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig,
  });

  const text = result?.response?.text?.() ?? "";
  const parsed = extractJsonFromText(text);

  if (parsed) return parsed;

  // If parsing fails, return a safe signal object (or throw)
  return markdownFallbackToPersona(text, persona);
};