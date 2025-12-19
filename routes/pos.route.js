import express from "express";
import {
  createPointOfSale,
  deletePointOfSale,
  getAllPointOfSale,
  getCashiersByPos,
  getPointOfSaleById,
  getPointOfSaleStats,
  updatePointOfSale,
} from "../controllers/pos.controller.js";
import { authMiddleware, isSuperAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware, isSuperAdmin);

router.get("/", getAllPointOfSale);
router.get("/:id", getPointOfSaleById);
router.post("/", createPointOfSale);
router.put("/:id", updatePointOfSale);
router.delete("/:id", deletePointOfSale);

router.get("/:id/cashiers", getCashiersByPos);
router.get("/:id/stats", getPointOfSaleStats);

export default router;
