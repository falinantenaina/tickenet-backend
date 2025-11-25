// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes API
import { connectDb } from "./config/database.js";
import authRoutes from "./routes/auth.route.js";
import planRoutes from "./routes/plan.route.js";
import salesRoutes from "./routes/sales.route.js";
import ticketRoutes from "./routes/tickets.route.js";

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/sales", salesRoutes);

// Routes pour servir les pages HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-dashboard.html"));
});

app.get("/buy", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "buy-ticket.html"));
});

// Route de test
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Serveur en ligne",
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err);
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  connectDb();
  console.log("=".repeat(50));
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 Dashboard admin: http://localhost:${PORT}/admin`);
  console.log(`🎫 Achat tickets: http://localhost:${PORT}/buy`);
  console.log("=".repeat(50));
});
