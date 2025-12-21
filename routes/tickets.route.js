import express from "express";
import {
  purchaseTicket,
  verifyTicket,
} from "../controllers/ticket.controller.js";
import { authMiddleware, isAutorized } from "../middleware/auth.middleware.js";
const router = express.Router();


router.post("/purchase", authMiddleware, isAutorized, purchaseTicket);

router.get("/verify/:code", verifyTicket);

export default router;
