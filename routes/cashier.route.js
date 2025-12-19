import express from "express";
import {
  createCashier,
  deleteCashier,
  getAllCashiers,
  getCashier,
  updateCashier,
} from "../controllers/cashier.controller.js";
import { authMiddleware, isSuperAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware, isSuperAdmin);

router.get("/", getAllCashiers);
router.get("/:id", getCashier);
router.post("/", createCashier);
router.put("/:id", updateCashier);
router.delete("/:id", deleteCashier);

export default router;
