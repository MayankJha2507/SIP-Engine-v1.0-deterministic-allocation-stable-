import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import apiRoutes from "./src/backend/routes/index.ts";
import { errorHandler } from "./src/backend/middleware/errorHandler.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware for CORS
  app.use(cors({
    origin: "*"
  }));

  // Middleware for JSON parsing
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Modular Routes
  app.use("/api", apiRoutes);

  // Vite integration / Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve("dist");
    app.use(express.static(distPath));
    // Fallback for frontend routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error Handler
  app.use(errorHandler);

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`SIPSense server running on port ${PORT}`);
  });
}

startServer();
