import express from "express";
import {
  createPlan,
  deletePlan,
  getAllPlan,
  updatePlan,
} from "../controllers/plan.controller.js";
import { authMiddleware, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes publiques
router.get("/", getAllPlan);

// Routes protégées (admin seulement)
router.post("/", authMiddleware, isAdmin, createPlan);
router.put("/:id", authMiddleware, isAdmin, updatePlan);
router.delete("/:id", authMiddleware, isAdmin, deletePlan);

export default router;
