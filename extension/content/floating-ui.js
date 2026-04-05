(function () {
  window.onerror = function (msg, url, line) {
    console.error("🔥 UI ERROR:", msg, "at", line);
  };

  if (document.getElementById("ai-agent-ui")) return;

  const ui = document.createElement("div");
  ui.id = "ai-agent-ui";

  ui.innerHTML = `
    <div id="ai-agent-header">
      <div class="ai-agent-title">🤖 AI Agent OS</div>
      <div class="ai-agent-controls">
        <button id="ai-agent-minimize" title="Minimize">_</button>
        <button id="ai-agent-close" title="Close">×</button>
      </div>
    </div>

    <div id="ai-agent-tabs">
      <button class="ai-agent-tab-btn active" data-tab="run">Run</button>
      <button class="ai-agent-tab-btn" data-tab="config">Config</button>
      <button class="ai-agent-tab-btn" data-tab="profile">Profile</button>
    </div>

    <div id="ai-agent-body">
      <!-- RUN TAB -->
      <div id="ai-agent-tab-run" class="ai-agent-tab-content active">
        <div class="ai-agent-section">
          <textarea id="ai-agent-task" placeholder="What should I do on this page?"></textarea>
        </div>

        <div class="ai-agent-grid">
          <div class="ai-agent-section">
            <label>Model</label>
            <select id="ai-agent-model">
              <option value="mistral:instruct">Mistral (Survey)</option>
              <option value="mistral:latest">Mistral (General)</option>
              <option value="llava:latest">LLaVA (Vision)</option>
              <option value="cloud">Cloud Mistral</option>
            </select>
          </div>

          <div class="ai-agent-section">
            <label>Mode</label>
            <select id="ai-agent-mode">
              <option value="hybrid">Hybrid</option>
              <option value="fast">Fast</option>
              <option value="accurate">Accurate</option>
            </select>
          </div>
        </div>

        <div class="ai-agent-section ai-agent-flex">
          <label class="ai-agent-checkbox">
            <input type="checkbox" id="ai-agent-vision" />
            <span>Vision</span>
          </label>
          <label class="ai-agent-checkbox">
            <input type="checkbox" id="ai-agent-autopilot" checked />
            <span>Auto-Pilot</span>
          </label>
        </div>

        <div class="ai-agent-section ai-agent-flex">
          <label class="ai-agent-checkbox">
            <input type="checkbox" id="ai-agent-memory" checked />
            <span>Smart Memory</span>
          </label>
          <label class="ai-agent-checkbox">
            <input type="checkbox" id="ai-agent-profile-toggle" checked />
            <span>Use Profile</span>
          </label>
        </div>

        <div class="ai-agent-buttons">
          <button id="ai-agent-run" class="ai-agent-btn-primary">▶ Run Task</button>
          <button id="ai-agent-stop" class="ai-agent-btn-secondary">⏹ Stop</button>
          <button id="ai-agent-toggle-grid" class="ai-agent-btn-secondary">🌐 Grid</button>
        </div>

        <div id="ai-agent-status">System Idle</div>
        <div id="ai-agent-logs"></div>
      </div>

      <!-- CONFIG TAB -->
      <div id="ai-agent-tab-config" class="ai-agent-tab-content">
        <div class="ai-agent-section">
          <label>AI Server URL</label>
          <input type="text" id="ai-agent-server-url" placeholder="http://localhost:3000" />
        </div>
        <div class="ai-agent-section">
          <label>Mistral API Key</label>
          <input type="password" id="ai-agent-mistral-key" placeholder="Enter API Key" />
        </div>
        <div class="ai-agent-section">
          <label>Ollama URL</label>
          <input type="text" id="ai-agent-ollama-url" placeholder="http://localhost:11434" />
        </div>
        <div class="ai-agent-section ai-agent-flex">
          <label class="ai-agent-checkbox">
            <input type="checkbox" id="ai-agent-stealth" checked />
            <span>Stealth Mode</span>
          </label>
          <label class="ai-agent-checkbox">
            <input type="checkbox" id="ai-agent-auto-captcha" checked />
            <span>Auto-Captcha</span>
          </label>
        </div>
        <button id="ai-agent-save-config" class="ai-agent-btn-primary" style="margin-top: 10px;">Save Config</button>
      </div>

      <!-- PROFILE TAB -->
      <div id="ai-agent-tab-profile" class="ai-agent-tab-content">
        <div class="ai-agent-section">
          <label>Neural Profile (JSON/Text)</label>
          <textarea id="ai-agent-profile-data" style="height: 200px;" placeholder="Enter your personal details for the AI..."></textarea>
        </div>
        <button id="ai-agent-save-profile" class="ai-agent-btn-primary" style="margin-top: 10px;">Update Memory</button>
      </div>
    </div>
  `;

  // ---- TAB LOGIC ----
  const tabs = ui.querySelectorAll(".ai-agent-tab-btn");
  const contents = ui.querySelectorAll(".ai-agent-tab-content");

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      ui.querySelector(`#ai-agent-tab-${tab.dataset.tab}`).classList.add("active");
    };
  });

  // ---- LOAD SETTINGS ----
  chrome.storage.local.get([
    "serverUrl", "aiMode", "mistralApiKey", "ollamaUrl", "ollamaModel", 
    "stealthEnabled", "autoCaptcha", "visionMode", "useMemory", "useProfile", "userProfileData"
  ], (settings) => {
    if (settings.serverUrl) serverUrlInput.value = settings.serverUrl;
    if (settings.mistralApiKey) mistralKeyInput.value = settings.mistralApiKey;
    if (settings.ollamaUrl) ollamaUrlInput.value = settings.ollamaUrl;
    
    if (settings.aiMode) {
      if (settings.aiMode === "mistral") modelSelect.value = "cloud";
      else modelSelect.value = settings.ollamaModel || "mistral:instruct";
    }
    
    if (settings.stealthEnabled !== undefined) document.getElementById("ai-agent-stealth").checked = settings.stealthEnabled;
    if (settings.autoCaptcha !== undefined) document.getElementById("ai-agent-auto-captcha").checked = settings.autoCaptcha;
    if (settings.visionMode) visionCheck.checked = settings.visionMode === "on";
    if (settings.useMemory !== undefined) memoryCheck.checked = settings.useMemory;
    if (settings.useProfile !== undefined) profileToggle.checked = settings.useProfile;
    
    if (settings.userProfileData) {
      profileDataInput.value = settings.userProfileData;
    } else {
      // Default profile if empty
      profileDataInput.value = "Age: 39\nGender: Male\nLocation: South Africa\nJob: Cyber Security Analyst";
    }
  });

  // ---- SAVE CONFIG ----
  document.getElementById("ai-agent-save-config").onclick = () => {
    chrome.storage.local.set({
      serverUrl: document.getElementById("ai-agent-server-url").value,
      mistralApiKey: document.getElementById("ai-agent-mistral-key").value,
      ollamaUrl: document.getElementById("ai-agent-ollama-url").value,
      stealthEnabled: document.getElementById("ai-agent-stealth").checked,
      autoCaptcha: document.getElementById("ai-agent-auto-captcha").checked
    }, () => {
      alert("Configuration Saved!");
    });
  };

  // ---- SAVE PROFILE ----
  document.getElementById("ai-agent-save-profile").onclick = () => {
    chrome.storage.local.set({
      userProfileData: document.getElementById("ai-agent-profile-data").value
    }, () => {
      alert("Neural Memory Updated!");
    });
  };

  // ---- DRAG LOGIC ----
  let isDragging = false;
  let offsetX, offsetY;

  const header = ui.querySelector("#ai-agent-header");

  header.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - ui.offsetLeft;
    offsetY = e.clientY - ui.offsetTop;
    ui.style.transition = 'none';
  };

  document.onmousemove = (e) => {
    if (!isDragging) return;
    ui.style.left = e.clientX - offsetX + "px";
    ui.style.top = e.clientY - offsetY + "px";
    ui.style.bottom = 'auto';
    ui.style.right = 'auto';
  };

  document.onmouseup = () => {
    isDragging = false;
    ui.style.transition = 'all 0.3s ease';
  };

  // ---- MINIMIZE / CLOSE ----
  const body = ui.querySelector("#ai-agent-body");
  const minimizeBtn = ui.querySelector("#ai-agent-minimize");
  const closeBtn = ui.querySelector("#ai-agent-close");

  minimizeBtn.onclick = () => {
    body.style.display = body.style.display === "none" ? "block" : "none";
    minimizeBtn.textContent = body.style.display === "none" ? "□" : "_";
  };

  closeBtn.onclick = () => {
    ui.remove();
  };

  // ---- ACTIONS ----
  const runBtn = document.getElementById("ai-agent-run");
  const stopBtn = document.getElementById("ai-agent-stop");
  const taskInput = document.getElementById("ai-agent-task");
  const logsPanel = document.getElementById("ai-agent-logs");
  const statusIndicator = document.getElementById("ai-agent-status");
  
  const modelSelect = document.getElementById("ai-agent-model");
  const modeSelect = document.getElementById("ai-agent-mode");
  const visionCheck = document.getElementById("ai-agent-vision");
  const autopilotCheck = document.getElementById("ai-agent-autopilot");
  const memoryCheck = document.getElementById("ai-agent-memory");
  const profileToggle = document.getElementById("ai-agent-profile-toggle");
  
  const serverUrlInput = document.getElementById("ai-agent-server-url");
  const mistralKeyInput = document.getElementById("ai-agent-mistral-key");
  const ollamaUrlInput = document.getElementById("ai-agent-ollama-url");
  const profileDataInput = document.getElementById("ai-agent-profile-data");

  function addLog(msg, type = 'info') {
    const log = document.createElement("div");
    log.className = `ai-agent-log ai-agent-log-${type}`;
    log.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logsPanel.prepend(log);
  }

  runBtn.onclick = () => {
    const task = taskInput.value.trim();
    if (!task) return addLog("Please enter a task", "error");

    const model = modelSelect?.value;
    const mode = modeSelect?.value;
    const vision = visionCheck?.checked;
    const autopilot = autopilotCheck?.checked;
    const useMemory = memoryCheck?.checked;
    const useProfile = profileToggle?.checked;

    statusIndicator.textContent = "Running...";
    statusIndicator.className = "ai-agent-status-active";
    logsPanel.innerHTML = "";
    addLog(`🚀 Starting task: ${task}`, "system");

    chrome.storage.local.set({
      useMemory,
      useProfile,
      visionMode: vision ? "on" : "off"
    });

    chrome.runtime.sendMessage({
      type: "START_TASK",
      task,
      model,
      mode,
      vision,
      autopilot,
      useMemory,
      useProfile,
      dom: document.documentElement.outerHTML,
      url: window.location.href
    });
  };

  stopBtn.onclick = () => {
    statusIndicator.textContent = "Stopped";
    statusIndicator.className = "";
    addLog("⏹ Task stopped", "warning");
    chrome.runtime.sendMessage({ type: "STOP_TASK" });
  };

  document.getElementById("ai-agent-toggle-grid").onclick = () => {
    chrome.runtime.sendMessage({ type: "TOGGLE_GRID" });
  };

  // ---- LISTEN FOR UPDATES FROM BACKGROUND ----
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "LOG") {
      addLog(msg.message, msg.logType);
    }
    if (msg.type === "STATUS") {
      statusIndicator.textContent = msg.message;
    }
    if (msg.type === "TASK_COMPLETE") {
      statusIndicator.textContent = "Complete";
      statusIndicator.className = "ai-agent-status-success";
      addLog("✅ Task complete", "success");
    }
    if (msg.type === "TOGGLE_UI") {
      ui.style.display = ui.style.display === "none" ? "block" : "none";
    }
  });

})();
