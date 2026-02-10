// backend/controllers/persona.controller.js
import Persona from "../models/persona.model.js";
import { generatePersonaFromData,  refinePersonaWithPrompt  } from "../lib/ai.js";
import { extractDocument } from "../lib/extract.js";


export const createPersonaFromPayload = async (req, res) => {
  try {
    const payload = req.body; // raw data
    const aiResult = await generatePersonaFromData(payload);
    const persona = await Persona.create({
      userId: req.user.id,
      data: aiResult,
      name: aiResult.name || "Generated Persona",
      summary: aiResult.summary || "",
      emotional_profile: aiResult.emotional_profile || {},
    });
    res.status(201).json(persona);
  } catch (err) {
    console.error("createPersona error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const createPersonaFromUpload = async (req, res) => {
  try {
   

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // ✅ read context from multipart form-data
    const context = (req.body?.context || "").trim();

    const extracted = await extractDocument(req.file);

    const payload = {
      source: {
        filename: req.file.originalname,
        sizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        extractedKind: extracted.kind,
      },
      document: {
        extractedText: extracted.extractedText || "",
        meta: extracted.meta || {},
      },

      // ✅ add user guidance for the AI
      userContext: context, // <-- new
    };

    const aiResult = await generatePersonaFromData(payload);
    console.log("ai result", aiResult);

    // ✅ use one consistent user id (recommend req.user.userId if that’s your auth shape)
    const userId =  req.user.id;

    const persona = await Persona.create({
      userId,
      name: aiResult.name || "Generated Persona",
      summary: aiResult.summary || "",

      // store raw AI response
      data: aiResult.raw || aiResult,

      extracted_insights: aiResult.extracted_insights || {},
      emotional_profile: aiResult.emotional_profile || {},
      messaging_pillars: aiResult.messaging_pillars || {},
      accessibility_profile: aiResult.accessibility_profile || {},
      engagement_strategy: aiResult.engagement_strategy || {},

      // ✅ optional: store the context for auditing/debugging
      // only if your Persona model has this column (see note below)
      context: context || null,
    });

    res.status(201).json(persona);
  } catch (err) {
    console.error("createPersonaFromUpload error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const listPersonas = async (req, res) => {
  try {
    const list = await Persona.findAll({ where: { userId: req.user.id } });
    res.json(list);
    console.log("found personas:", list.length);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPersona = async (req, res) => {
  try {
    const p = await Persona.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const refinePersona = async (req, res) => {
  try {
    const { persona, prompt } = req.body || {};

    if (!persona || typeof persona !== "object") {
      return res.status(400).json({ message: "persona must be an object" });
    }
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" });
    }

    const refined = await refinePersonaWithPrompt({
      persona,
      prompt: prompt.trim(),
    });

    // Frontend expects: { refinedPersona }
    return res.json({ refinedPersona: refined });
  } catch (err) {
    console.error("refinePersona error:", err);
    return res.status(500).json({ message: err.message || "AI refine failed" });
  }
};