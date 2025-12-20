import express from "express";
import {
  purchaseTicket,
  verifyTicket,
} from "../controllers/ticket.controller.js";
import { authMiddleware, isCashier } from "../middleware/auth.middleware.js";
const router = express.Router();

router.use(authMiddleware, isCashier);

router.post("/purchase", purchaseTicket);

router.get("/verify/:code", verifyTicket);

export default router;
