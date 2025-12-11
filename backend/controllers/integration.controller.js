// backend/controllers/integration.controller.js
import Integration from "../models/integration.model.js";

export const connectIntegration = async (req, res) => {
  try {
    const payload = { userId: req.user.userId, ...req.body };
    const existing = await Integration.findOne({ where: { userId: req.user.userId, provider: payload.provider } });
    if (existing) {
      existing.config = payload.config;
      existing.connected = true;
      await existing.save();
      return res.json(existing);
    }
    const created = await Integration.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listIntegrations = async (req, res) => {
  try {
    const list = await Integration.findAll({ where: { userId: req.user.userId } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
