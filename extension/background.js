let isRunning = false;

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {

  if (msg.type === "START_TASK") {
    isRunning = true;

    chrome.storage.local.get(["serverUrl", "mistralApiKey", "ollamaUrl", "stealthEnabled", "userProfileData", "autoCaptcha"], (saved) => {
      const settings = {
        serverUrl: saved.serverUrl || "http://localhost:3000",
        aiMode: msg.model === "cloud" ? "mistral" : "ollama",
        speedMode: msg.mode || "balanced",
        ollamaUrl: saved.ollamaUrl || "http://localhost:11434",
        ollamaModel: msg.model === "cloud" ? "mistral-large-latest" : (msg.model || "mistral:instruct"),
        mistralApiKey: saved.mistralApiKey,
        stealthEnabled: saved.stealthEnabled !== undefined ? saved.stealthEnabled : true,
        visionMode: msg.vision ? "on" : "off",
        autopilot: msg.autopilot !== undefined ? msg.autopilot : true,
        useMemory: msg.useMemory !== undefined ? msg.useMemory : true,
        useProfile: msg.useProfile !== undefined ? msg.useProfile : true,
        autoCaptcha: saved.autoCaptcha !== undefined ? saved.autoCaptcha : true,
        userProfileData: saved.userProfileData
      };

      const task = msg.task;
      const initialDom = msg.dom;

      runAgentLoop(task, settings, initialDom);
    });
  }

  if (msg.type === "STOP_TASK") {
    isRunning = false;
  }

  if (msg.type === "TOGGLE_GRID") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_GRID" }).catch(() => {});
    }
  }
});

async function captureScreenshot() {
  try {
    return await chrome.tabs.captureVisibleTab(null, {
      format: "png"
    });
  } catch (e) {
    console.error("Screenshot failed:", e);
    return null;
  }
}

async function sendToUI(type, message, logType = 'info') {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type, message, logType }).catch(() => {});
  }
}

async function runAgentLoop(task, settings, initialDom) {
  let iteration = 0;
  const maxIterations = settings.autopilot ? 20 : 1;

  while (isRunning && iteration < maxIterations) {
    iteration++;
    try {
      // Get DOM from active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) break;

      let dom = initialDom && iteration === 1 ? initialDom : null;
      if (!dom) {
        try {
          dom = await chrome.tabs.sendMessage(tab.id, { type: "GET_DOM" });
        } catch (e) {
          console.log("Could not get DOM from content script, falling back to vision");
        }
      }
      
      const { aiMode, speedMode, ollamaUrl, stealthEnabled, visionMode, useMemory, useProfile, userProfileData } = settings;

      await sendToUI("STATUS", `Running (Step ${iteration})...`);
      await sendToUI("LOG", `Step ${iteration}: Analyzing page...`);

      // 🕵️ STEALTH DELAY
      if (stealthEnabled) {
        const delay = Math.random() * 2000 + 1000;
        await sendToUI("LOG", `🕵️ Stealth: Waiting ${delay.toFixed(0)}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }

      // 🔴 Call backend
      const serverUrl = settings.serverUrl || "http://localhost:3000";
      const agentEndpoint = `${serverUrl.replace(/\/$/, "")}/agent`;
      const captchaEndpoint = `${serverUrl.replace(/\/$/, "")}/solve-captcha`;

      let response;
      const useVision = visionMode === "on" || !dom;

      if (useVision) {
        await sendToUI("LOG", "👁️ Using Vision Mode...");
        const image = await captureScreenshot();
        response = await fetch(agentEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: "vision",
            image,
            url: tab.url,
            aiMode,
            speedMode,
            ollamaUrl,
            ollamaModel: settings.ollamaModel,
            mistralApiKey: settings.mistralApiKey,
            useMemory,
            useProfile,
            userProfileData,
            messages: [
              { role: "user", content: task }
            ]
          })
        });
      } else {
        response = await fetch(agentEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            agent: "red",
            url: tab.url,
            aiMode,
            speedMode,
            ollamaUrl,
            ollamaModel: settings.ollamaModel,
            mistralApiKey: settings.mistralApiKey,
            useMemory,
            useProfile,
            userProfileData,
            messages: [
              { role: "user", content: task },
              { role: "system", content: dom }
            ]
          })
        });
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Backend error");

      let parsed;
      try {
        parsed = typeof data.output === 'string' ? JSON.parse(data.output) : data.output;
      } catch (e) {
        parsed = { decision: data.output };
      }

      if (parsed.decision) {
        await sendToUI("LOG", `🤖 AI: ${parsed.decision}`, "success");
      }

      // 🤖 CAPTCHA Handling
      if (parsed.needsCaptcha) {
        if (!settings.autoCaptcha) {
          await sendToUI("LOG", "⚠️ CAPTCHA detected. Auto-solve is OFF. Please solve manually.", "warning");
          await sleep(5000);
          continue;
        }
        await sendToUI("LOG", "🤖 CAPTCHA detected! Attempting to solve...", "warning");
        const captchaInfo = await chrome.tabs.sendMessage(tab.id, { type: "GET_CAPTCHA_INFO" });
        
        if (captchaInfo && captchaInfo.siteKey) {
          try {
            const solveRes = await fetch(captchaEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                siteKey: captchaInfo.siteKey,
                url: tab.url
              })
            });
            const solveData = await solveRes.json();
            if (solveData.token) {
              await chrome.tabs.sendMessage(tab.id, { 
                type: "INJECT_CAPTCHA", 
                token: solveData.token 
              });
              await sendToUI("LOG", "✅ CAPTCHA solved and injected!", "success");
              await sleep(3000);
              continue;
            }
          } catch (e) {
            await sendToUI("LOG", "❌ Failed to solve CAPTCHA automatically", "error");
          }
        } else {
          await sendToUI("LOG", "⚠️ Waiting for human CAPTCHA input...", "warning");
          await sleep(5000);
          continue;
        }
      }

      const actions = parsed.actions || [];

      // Send actions to content script
      if (actions.length > 0) {
        await sendToUI("LOG", `👉 Executing ${actions.length} actions...`);
        await chrome.tabs.sendMessage(tab.id, {
          type: "EXECUTE_ACTIONS",
          actions
        });
      } else if (!parsed.needsCaptcha) {
        await sendToUI("LOG", "🏁 No more actions needed.");
        if (!settings.autopilot) break;
      }

      if (parsed.complete) {
        await sendToUI("TASK_COMPLETE");
        break;
      }

    } catch (error) {
      console.error("Agent loop error:", error);
      await sendToUI("LOG", `❌ Error: ${error.message}`, "error");
      isRunning = false;
      break;
    }

    if (!settings.autopilot) break;
    await sleep(2000);
  }

  if (isRunning && iteration >= maxIterations) {
    await sendToUI("LOG", "⚠️ Max iterations reached", "warning");
  }
  
  isRunning = false;
  await sendToUI("STATUS", "System Idle");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
