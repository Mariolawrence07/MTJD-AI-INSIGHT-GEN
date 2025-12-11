// backend/controllers/persona.controller.js
import Persona from "../models/persona.model.js";
import { generatePersonaFromData } from "../lib/ai.js";

export const createPersonaFromPayload = async (req, res) => {
  try {
    const payload = req.body; // raw data
    const aiResult = await generatePersonaFromData(payload);
    const persona = await Persona.create({
      userId: req.user.userId,
      name: aiResult.name || "Generated Persona",
      summary: aiResult.summary || "",
      data: aiResult.raw || aiResult,
      emotional_profile: aiResult.emotional_profile || {},
    });
    res.status(201).json(persona);
  } catch (err) {
    console.error("createPersona error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const listPersonas = async (req, res) => {
  try {
    const list = await Persona.findAll({ where: { userId: req.user.userId } });
    res.json(list);
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
