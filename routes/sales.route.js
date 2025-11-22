import express from "express";
import {
  getSalesHistory,
  getSalesStats,
} from "../controllers/sale.controller.js";
import { authMiddleware, isAdmin } from "../middleware/auth.middleware.js";
const router = express.Router();

// Routes protégées (admin seulement)
router.get("/stats", authMiddleware, isAdmin, getSalesStats);
router.get("/history", authMiddleware, isAdmin, getSalesHistory);

export default router;
