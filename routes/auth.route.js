import express from "express";
import { getProfil, login, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);

router.get("/profil", authMiddleware, getProfil);

export default router;
