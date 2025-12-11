// backend/controllers/campaign.controller.js
import Campaign from "../models/campaign.model.js";
import AdCreative from "../models/adCreative.model.js";

export const createCampaign = async (req, res) => {
  try {
    const c = await Campaign.create({ userId: req.user.userId, ...req.body });
    res.status(201).json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const listCampaigns = async (req, res) => {
  try {
    const list = await Campaign.findAll({ where: { userId: req.user.userId } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCreative = async (req, res) => {
  try {
    const creative = await AdCreative.create({ ...req.body });
    res.status(201).json(creative);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
