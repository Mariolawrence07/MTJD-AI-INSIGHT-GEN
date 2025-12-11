// backend/controllers/analytics.controller.js
import Analytics from "../models/analytics.model.js";

export const campaignMetrics = async (req, res) => {
  try {
    const metrics = await Analytics.findAll({ where: { campaignId: req.params.id } });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
