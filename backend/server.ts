import express from "express";
import cors from "cors";
import { selectModel, runRedAgent, runBlueAgent, runVisionAgent } from "./src/ai/agents.ts";
import { injectProfile } from "./src/memory.ts";
import { LearningEngine } from "./src/learningEngine.ts";
import { ProxyManager } from "./src/proxyManager.ts";
import { isBlocked } from "./src/security/blockDetector.ts";

import { detectCaptcha } from "./src/security/captchaDetector.ts";
import { solveRecaptcha, getAllBalances } from "./src/security/captchaSolver.ts";
import fetch from "node-fetch";

const learningEngine = new LearningEngine();
const proxyManager = new ProxyManager();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Increase limit for screenshots

  // API Routes
  app.get("/captcha-balances", async (req, res) => {
    try {
      const balances = await getAllBalances();
      res.json(balances);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/solve-captcha", async (req, res) => {
    try {
      const { siteKey, url } = req.body;
      if (!siteKey || !url) {
        return res.status(400).json({ error: "siteKey and url are required" });
      }
      const token = await solveRecaptcha(siteKey, url);
      res.json({ token });
    } catch (error) {
      console.error("🔥 CAPTCHA Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/agent", async (req, res) => {
    try {
      const { agent, messages, image, ollamaUrl, ollamaModel, mistralApiKey, url, rotateProxy, aiMode, speedMode, useMemory, useProfile, userProfileData } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ success: false, error: "Invalid messages format" });
      }

      const task = messages?.[0]?.content || "";
      let dom = messages?.[1]?.content || "";
      const useCache = speedMode !== "accurate";

      // 🌐 Fetch DOM if URL is provided and DOM is placeholder
      if (url && (dom === "Current Page DOM Context" || !dom)) {
        console.log(`🌐 Fetching DOM from URL: ${url}`);
        try {
          const pageRes = await fetch(url);
          if (pageRes.ok) {
            dom = await pageRes.text();
            console.log(`✅ DOM fetched (${dom.length} bytes)`);
          }
        } catch (fetchErr) {
          console.error("❌ Failed to fetch DOM:", fetchErr);
        }
      }

      console.log(`🤖 Agent Request: ${agent} | Mode: ${aiMode} | Model: ${ollamaModel || 'default'}`);

      // 🤖 CAPTCHA Detection
      if (detectCaptcha(dom)) {
        console.log("🤖 CAPTCHA detected in DOM");
        return res.json({ 
          success: true,
          output: JSON.stringify({ 
            needsCaptcha: true, 
            message: "CAPTCHA detected. Please solve or wait for auto-solver." 
          }) 
        });
      }

      // 🚫 Check if blocked
      if (isBlocked(dom)) {
        console.log("🚫 Block detected in DOM → Rotating Proxy");
        const nextProxy = proxyManager.getNextProxy();
        return res.json({ 
          success: true,
          output: JSON.stringify({ useVision: true, rotatedProxy: nextProxy, message: "Blocked, rotating..." }) 
        });
      }

      // 🧠 Check learned behavior
      if (url && agent === "red" && !rotateProxy) {
        const learned = learningEngine.findBestMatch(url);
        if (learned) {
          console.log("🧠 Using learned behavior for:", url);
          return res.json({
            success: true,
            output: JSON.stringify({ actions: learned.actionSequence, learned: true })
          });
        }
      }

      if (image) {
        const result = await runVisionAgent(messages[0].content, image, aiMode, mistralApiKey, useMemory, useProfile, userProfileData);
        return res.json({ success: true, output: JSON.stringify(result) });
      }

      let result;

      if (agent === "red") {
        result = await runRedAgent(task, dom, ollamaUrl, undefined, aiMode, useCache, mistralApiKey, ollamaModel, useMemory, useProfile, userProfileData);
        
        // 🧠 Store successful actions if they exist
        if (url && result.actions && result.actions.length > 0) {
          learningEngine.store(url, result.actions, useMemory);
        }
      } else {
        result = await runBlueAgent(task, dom, ollamaUrl, aiMode, useCache, mistralApiKey, ollamaModel, useMemory, useProfile, userProfileData);
      }

      // Return exact format expected by extension
      res.json({
        success: true,
        output: JSON.stringify(result)
      });

    } catch (error) {
      console.error("🔥 BACKEND ERROR:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        tip: "Ensure your local Ollama server is running if using local models, or check your Mistral API key."
      });
    }
  });

  app.post("/api/agent/run", async (req, res) => {
    // Legacy endpoint for compatibility
    const { task, ollamaUrl } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, error: "Task is required" });
    }

    try {
      const result = await runRedAgent(task, "No DOM provided", ollamaUrl);
      res.json({ 
        success: true, 
        result: { response: JSON.stringify(result) }, 
        model: task.toLowerCase().includes("survey") ? "mistral:instruct" : "llama3.2",
        agent: task.toLowerCase().includes("survey") ? "Red Agent" : "Blue Agent"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/profile", (req, res) => {
    res.json({ success: true, profile: injectProfile("") });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
