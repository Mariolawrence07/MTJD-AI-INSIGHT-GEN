// backend/controllers/billing.controller.js
import Subscription from "../models/subscription.model.js";

export const subscribe = async (req, res) => {
  try {
    const s = await Subscription.create({ userId: req.user.userId, ...req.body });
    res.status(201).json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
