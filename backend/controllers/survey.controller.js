// backend/controllers/survey.controller.js
import Survey from "../models/survey.model.js";
import Persona from "../models/persona.model.js";
import { generatePersonaFromData } from "../lib/ai.js";

export const createSurvey = async (req, res) => {
  try {
    const survey = await Survey.create({ userId: req.user.userId, ...req.body });
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findByPk(id);
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    const responses = survey.responses || [];
    responses.push(req.body);
    survey.responses = responses;
    await survey.save();

    // Optionally auto-generate persona
    const ai = await generatePersonaFromData(responses);
    const persona = await Persona.create({
      userId: req.user.userId,
      name: ai.name || "From Survey",
      summary: ai.summary || "",
      data: ai.raw || ai,
      emotional_profile: ai.emotional_profile || {},
    });

    res.json({ survey, persona });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
