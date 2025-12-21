import express from "express";
import {
  createPlan,
  deletePlan,
  getAllPlan,
  updatePlan,
} from "../controllers/plan.controller.js";
import { authMiddleware, isSuperAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllPlan);

router.use(authMiddleware, isSuperAdmin)

router.post("/", createPlan);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
