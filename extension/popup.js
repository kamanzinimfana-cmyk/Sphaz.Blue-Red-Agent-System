const runBtn = document.getElementById("run-btn");
const stopBtn = document.getElementById("stop-btn");
const taskInput = document.getElementById("task-input");
const statusBadge = document.getElementById("status-badge");
const statusText = document.getElementById("status-text");
const logsDiv = document.getElementById("logs");
const clearLogsBtn = document.getElementById("clear-logs");
const saveSettingsBtn = document.getElementById("save-settings");

const tabs = document.querySelectorAll(".tab-btn");
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    
    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
  };
});

function addLog(msg, type = "system") {
  const log = document.createElement("div");
  log.className = `log-entry log-${type}`;
  
  const time = document.createElement("span");
  time.className = "log-time";
  time.innerText = new Date().toLocaleTimeString([], { hour12: false });
  
  const text = document.createElement("span");
  text.innerText = msg;
  
  log.appendChild(time);
  log.appendChild(text);
  
  // Remove empty state if present
  const empty = logsDiv.querySelector(".empty-state");
  if (empty) empty.remove();
  
  logsDiv.prepend(log);
}

clearLogsBtn.onclick = () => {
  logsDiv.innerHTML = '<div class="empty-state">System ready...</div>';
};

runBtn.onclick = () => {
  const task = taskInput.value.trim();
  if (!task) {
    addLog("Please enter a task", "error");
    return;
  }

  const settings = {
    serverUrl: document.getElementById('server-url').value,
    aiMode: document.getElementById('ai-mode').value,
    mistralApiKey: document.getElementById('mistral-api-key').value,
    ollamaUrl: document.getElementById('ollama-url').value,
    ollamaModel: document.getElementById('ollama-model').value,
    stealthEnabled: document.getElementById('stealth-mode').checked,
    autoCaptcha: document.getElementById('auto-captcha').checked
  };

  statusBadge.classList.add("running");
  statusText.innerText = "RUNNING";
  
  runBtn.disabled = true;
  stopBtn.disabled = false;
  
  addLog(`🚀 Starting task: ${task}`, "system");

  chrome.runtime.sendMessage({
    type: "START_TASK",
    task,
    settings
  });
};

stopBtn.onclick = () => {
  statusBadge.classList.remove("running");
  statusText.innerText = "IDLE";
  
  runBtn.disabled = false;
  stopBtn.disabled = true;
  
  addLog("⏹ Task stopped by user", "system");

  chrome.runtime.sendMessage({
    type: "STOP_TASK"
  });
};

saveSettingsBtn.onclick = () => {
  const settings = {
    serverUrl: document.getElementById('server-url').value,
    aiMode: document.getElementById('ai-mode').value,
    mistralApiKey: document.getElementById('mistral-api-key').value,
    ollamaUrl: document.getElementById('ollama-url').value,
    ollamaModel: document.getElementById('ollama-model').value,
    stealthEnabled: document.getElementById('stealth-mode').checked,
    autoCaptcha: document.getElementById('auto-captcha').checked
  };
  
  chrome.storage.local.set({ settings }, () => {
    addLog("✅ Configuration saved", "success");
  });
};

// Dynamic UI visibility
document.getElementById('ai-mode').onchange = (e) => {
  const mode = e.target.value;
  document.getElementById('mistral-config').style.display = (mode === 'mistral' || mode === 'auto') ? 'block' : 'none';
  document.getElementById('ollama-config').style.display = (mode === 'ollama' || mode === 'auto') ? 'block' : 'none';
};

// Load saved settings
chrome.storage.local.get(['settings'], (result) => {
  if (result.settings) {
    document.getElementById('server-url').value = result.settings.serverUrl || "http://localhost:3000";
    document.getElementById('ai-mode').value = result.settings.aiMode || "auto";
    document.getElementById('mistral-api-key').value = result.settings.mistralApiKey || "";
    document.getElementById('ollama-url').value = result.settings.ollamaUrl || "http://localhost:11434";
    document.getElementById('ollama-model').value = result.settings.ollamaModel || "mistral:instruct";
    document.getElementById('stealth-mode').checked = result.settings.stealthEnabled !== false;
    document.getElementById('auto-captcha').checked = result.settings.autoCaptcha !== false;
    
    // Trigger visibility update
    document.getElementById('ai-mode').onchange({ target: { value: document.getElementById('ai-mode').value } });
  }
});
