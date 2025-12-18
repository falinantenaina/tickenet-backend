import express from "express";
import {
  getSalesHistory,
  getSaleStats,
} from "../controllers/sale.controller.js";
const router = express.Router();

// Routes protégées (admin seulement)
router.get("/stats", getSaleStats);
router.get("/history", getSalesHistory);

export default router;
