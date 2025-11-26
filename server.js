// server.js
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";

const __dirname = path.resolve();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://itad-wifi.vercel.app"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Route de test
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Serveur en ligne",
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("{*any}", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

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

(async () => {
  try {
    await connectDb(); //
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to DB:", error);
    process.exit(1);
  }
})();
