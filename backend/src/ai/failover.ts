import { getSmartCache, setSmartCache, shouldCache } from "../cache/cache.ts";
import { buildProfileContext } from "../brain/profilePrompt.ts";
import { getDirectAnswer } from "../brain/answerOverrides.ts";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

interface Message {
  role: string;
  content: string;
}

interface CallAIParams {
  messages: Message[];
  taskType: "survey" | "navigation";
  mode?: "auto" | "mistral" | "ollama";
  useCache?: boolean;
  ollamaUrl?: string;
  task: string;
}

async function callMistral(messages: Message[]) {
  if (!MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY missing");
  }

  console.log("🧠 Trying Mistral API...");
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages
    })
  });

  if (!res.ok) {
    throw new Error(`Mistral API failed: ${res.statusText}`);
  }

  const data = await res.json();
  const output = data.choices?.[0]?.message?.content;

  if (!output) {
    throw new Error("Empty Mistral response");
  }

  console.log("✅ Mistral success");
  return output;
}

async function callOllama({ messages, taskType, ollamaUrl }: { messages: Message[], taskType: string, ollamaUrl?: string }) {
  let model = "llama3.2";

  // Smart routing
  if (taskType === "survey") {
    model = "mistral:instruct";
  }

  const baseUrl = ollamaUrl || OLLAMA_URL;
  console.log(`🧠 Using Ollama model: ${model} at ${baseUrl}`);

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });

  if (!res.ok) {
    throw new Error(`Ollama failed: ${res.statusText}`);
  }

  const data = await res.json();
  const output = data.message?.content || data.response || "No response from Ollama";

  console.log("✅ Ollama success");
  return output;
}

export async function callAI({ messages, taskType, mode = "auto", useCache = true, ollamaUrl, task }: CallAIParams) {
  // ✅ 1. CHECK DIRECT OVERRIDES (Demographics)
  if (taskType === "survey") {
    const direct = getDirectAnswer(task);
    if (direct) {
      console.log("⚡ Direct profile answer used:", direct);
      return direct;
    }
  }

  // ✅ 2. CHECK SMART CACHE FIRST
  if (useCache && shouldCache(taskType)) {
    const cached = await getSmartCache(messages, task);
    if (cached) {
      return cached;
    }
  }

  // ✅ 3. INJECT PROFILE CONTEXT
  const profileContext = buildProfileContext();
  const enhancedMessages = [
    { role: "system", content: profileContext },
    ...messages
  ];

  let output: string;

  if (mode === "ollama") {
    output = await callOllama({ messages: enhancedMessages, taskType, ollamaUrl });
  } else if (mode === "mistral") {
    output = await callMistral(enhancedMessages);
  } else {
    // Auto / Failover mode
    try {
      output = await callMistral(enhancedMessages);
    } catch (err) {
      console.log("⚠️ Mistral failed → switching to Ollama...", err instanceof Error ? err.message : String(err));
      output = await callOllama({ messages: enhancedMessages, taskType, ollamaUrl });
    }
  }

  // ✅ 4. SAVE TO SMART CACHE
  if (useCache && shouldCache(taskType) && output) {
    await setSmartCache(messages, task, output);
  }

  return output;
}
