import express from "express";
import {
  getCashierStats,
  getSalesHistory,
  getSaleStats,
} from "../controllers/sale.controller.js";
import {
  authMiddleware,
  isAutorized,
  isSuperAdmin,
} from "../middleware/auth.middleware.js";
const router = express.Router();

router.use(authMiddleware, isAutorized);

router.get("/stats", getSaleStats);
router.get("/history", getSalesHistory);

router.get("/stats/cashier", isSuperAdmin, getCashierStats);

export default router;
