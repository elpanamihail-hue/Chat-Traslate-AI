import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Try standard logic
    projectId: firebaseConfig.projectId,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to send push notifications
  app.post("/api/send-notification", async (req, res) => {
    const { token, title, body, icon, url } = req.body;
    
    if (!token) return res.status(400).json({ error: "Missing token" });

    try {
      const message = {
        notification: { title, body },
        data: { url: url || "/" },
        token: token,
        android: {
          notification: { icon: "stock_ticker_update", color: "#0B0E11" }
        },
        webpush: {
          notification: { icon: icon || "https://picsum.photos/seed/vibe_notif/192/192" },
          fcm_options: { link: url || "/" }
        }
      };

      const response = await admin.messaging().send(message);
      res.json({ success: true, messageId: response });
    } catch (error) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
