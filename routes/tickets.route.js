import express from "express";
import {
  purchaseTicket,
  verifyTicket,
} from "../controllers/ticket.controller.js";
const router = express.Router();

// Route publique pour acheter un ticket
router.post("/purchase", purchaseTicket);

// Route publique pour vérifier un ticket
router.get("/verify/:code", verifyTicket);

export default router;
