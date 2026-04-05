import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  Brain, 
  History, 
  Cpu, 
  Zap, 
  Eye, 
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Activity,
  Shield,
  Database,
  Layout,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { 
  AppSettings, 
  LogEntry, 
  UserProfile, 
  AIMode, 
  SpeedMode, 
  VisionMode, 
  AIProvider 
} from './types';

export default function App() {
  // Tabs
  const [activeTab, setActiveTab] = useState<'run' | 'settings' | 'memory'>('run');
  
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'Idle' | 'Running' | 'Error' | 'Stopped'>('Idle');
  const [task, setTask] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    provider: 'gemini',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'mistral:instruct',
    blueAgentId: 'blue-nav-01',
    redAgentId: 'red-exec-01',
    aiMode: 'hybrid',
    speedMode: 'balanced',
    visionMode: 'off',
  });

  // Memory / Profile
  const [profile, setProfile] = useState<string>(
`Age: 39
Gender: Male
Location: South Africa
Language: English, IsiZulu
Job: Cyber Security Analyst & Developer
Income: $90k-$200k+`
  );

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'system') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const handleRun = async () => {
    if (!task.trim()) {
      addLog("Please enter a task", "error");
      return;
    }

    setIsRunning(true);
    setStatus('Running');
    setLogs([]);
    addLog(`🚀 Starting task: ${task}`, "system");

    try {
      addLog("📡 Connecting to AI Server...", "system");
      
      const response = await fetch('/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: task.toLowerCase().includes('survey') ? 'red' : 'blue',
          messages: [
            { role: 'user', content: task },
            { role: 'system', content: 'Current Page DOM Context' }
          ],
          ollamaUrl: settings.ollamaUrl,
          aiMode: settings.aiMode,
          speedMode: settings.speedMode
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Unknown server error");
      }

      const result = JSON.parse(data.output);
      const agentType = task.toLowerCase().includes('survey') ? 'Red Agent' : 'Blue Agent';
      
      addLog(`${agentType === 'Red Agent' ? '🔴' : '🔵'} ${agentType} active.`, agentType === 'Red Agent' ? 'red' : 'blue');
      addLog(`🤖 Decision: ${result.decision || 'Executing actions'}`, agentType === 'Red Agent' ? 'red' : 'blue');

      if (result.actions) {
        result.actions.forEach((action: any) => {
          addLog(`👉 Action: ${action.type} on "${action.text || action.time + 'ms'}"`, 'system');
        });
      }

      if (task.toLowerCase().includes('survey') || task.toLowerCase().includes('form')) {
        addLog("🔴 Red Agent: Survey logic engaged. Injecting memory profile...", "red");
        await new Promise(r => setTimeout(r, 1000));
        addLog("🔴 Red Agent: Smart click system fixing survey issues...", "red");
      }

      addLog("✅ Task processed by backend.", "success");
      setStatus('Idle');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addLog(`❌ Server Error: ${msg}`, "error");
      if (msg.includes("Unexpected end of JSON input")) {
        addLog("💡 Tip: The server might have crashed or returned an empty response. Check backend logs.", "system");
      } else {
        addLog("💡 Tip: Ensure your local Ollama server is running and accessible if using local mode.", "system");
      }
      setStatus('Error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStatus('Stopped');
    addLog("⏹ Task stopped by user.", "system");
  };

  const saveSettings = () => {
    addLog("Settings saved locally.", "success");
  };

  const saveProfile = () => {
    addLog("Memory profile updated.", "success");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto flex h-screen overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-slate-800/50 bg-slate-900/20 backdrop-blur-xl flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight">Agent OS</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">v2.0.4 - STABLE</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            {[
              { id: 'run', icon: Activity, label: 'Control Center' },
              { id: 'settings', icon: Settings, label: 'System Config' },
              { id: 'memory', icon: Database, label: 'Neural Memory' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  activeTab === item.id 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-indigo-400" : "text-slate-500")} />
                {item.label}
                {activeTab === item.id && (
                  <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <span>System Status</span>
                <span className={cn(
                  "flex items-center gap-1.5",
                  status === 'Running' ? "text-indigo-400" : "text-emerald-500"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Running' ? "bg-indigo-400 animate-pulse" : "bg-emerald-500")} />
                  {status}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: isRunning ? '100%' : '0%' }}
                  className="h-full bg-indigo-500"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-900/50 to-transparent">
          
          <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-900/20 backdrop-blur-md">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Layout className="w-4 h-4" />
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="capitalize text-slate-200 font-medium">{activeTab}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">B</div>
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-[10px] font-bold text-rose-400">R</div>
              </div>
              <div className="h-8 w-[1px] bg-slate-800" />
              <button className="p-2 text-slate-500 hover:text-white transition-colors">
                <Shield className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === 'run' && (
                <motion.div 
                  key="run"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex flex-col p-8 gap-6"
                >
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Terminal className="w-3 h-3" />
                          Command Input
                        </label>
                        <span className="text-[10px] text-slate-600">Markdown & URLs supported</span>
                      </div>
                      <div className="relative group">
                        <textarea 
                          value={task}
                          onChange={(e) => setTask(e.target.value)}
                          placeholder="Describe the task for the agents..."
                          className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none placeholder:text-slate-600 shadow-inner"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button 
                            onClick={handleRun}
                            disabled={isRunning}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/40"
                          >
                            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            Execute
                          </button>
                          <button 
                            onClick={handleStop}
                            disabled={!isRunning}
                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                          >
                            <Square className="w-3 h-3" />
                            Abort
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 bg-[#000]/40 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
                      <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                          </div>
                          <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                          <div className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">Console Output</div>
                        </div>
                        <button 
                          onClick={() => setLogs([])}
                          className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors rounded-md hover:bg-rose-400/10"
                          title="Clear Logs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] space-y-3 custom-scrollbar">
                        {logs.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4 opacity-50">
                            <Terminal className="w-12 h-12 stroke-[1px]" />
                            <p className="text-xs tracking-widest uppercase font-bold">System Idle - Awaiting Input</p>
                          </div>
                        )}
                        {logs.map((log) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={log.id} 
                            className={cn(
                              "flex gap-4 leading-relaxed group",
                              log.type === 'error' ? "text-rose-400" :
                              log.type === 'success' ? "text-emerald-400" :
                              log.type === 'blue' ? "text-indigo-400" :
                              log.type === 'red' ? "text-rose-500" :
                              "text-slate-400"
                            )}
                          >
                            <span className="text-slate-700 shrink-0 select-none opacity-50 group-hover:opacity-100 transition-opacity">
                              {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="flex-1">{log.message}</span>
                          </motion.div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div 
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full overflow-y-auto p-8 space-y-10 custom-scrollbar"
                >
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Cpu className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">AI Infrastructure</h3>
                        <p className="text-xs text-slate-500">Configure your neural processing units</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Primary Provider</label>
                        <select 
                          value={settings.provider}
                          onChange={(e) => setSettings({...settings, provider: e.target.value as AIProvider})}
                          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        >
                          <option value="gemini">Google Gemini (Cloud)</option>
                          <option value="ollama">Ollama (Local)</option>
                          <option value="mistral">Mistral (Cloud)</option>
                        </select>
                      </div>

                      {settings.provider === 'ollama' && (
                        <>
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ollama Endpoint</label>
                            <input 
                              type="text"
                              value={settings.ollamaUrl}
                              onChange={(e) => setSettings({...settings, ollamaUrl: e.target.value})}
                              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder="http://localhost:11434"
                            />
                          </div>
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Tag</label>
                            <input 
                              type="text"
                              value={settings.ollamaModel}
                              onChange={(e) => setSettings({...settings, ollamaModel: e.target.value})}
                              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                              placeholder="mistral:instruct"
                            />
                          </div>
                        </>
                      )}

                      {settings.provider === 'mistral' && (
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mistral API Key</label>
                          <input 
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                            placeholder="••••••••••••••••••••••••"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Operational Tuning</h3>
                        <p className="text-xs text-slate-500">Fine-tune agent behavior and performance</p>
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Logic Mode</h4>
                        <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
                          {(['hybrid', 'ollama', 'mistral'] as AIMode[]).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setSettings({...settings, aiMode: mode})}
                              className={cn(
                                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all capitalize",
                                settings.aiMode === mode 
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40" 
                                  : "text-slate-500 hover:text-slate-300"
                              )}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Optimization Strategy</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {(['fast', 'balanced', 'accurate'] as SpeedMode[]).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setSettings({...settings, speedMode: mode})}
                                className={cn(
                                  "py-3 px-2 rounded-xl text-[10px] font-bold border transition-all capitalize tracking-wider",
                                  settings.speedMode === mode 
                                    ? "bg-indigo-600 border-indigo-500 text-white" 
                                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                                )}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vision Fallback</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {(['on', 'off'] as VisionMode[]).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setSettings({...settings, visionMode: mode})}
                                className={cn(
                                  "py-3 px-2 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-wider",
                                  settings.visionMode === mode 
                                    ? "bg-indigo-600 border-indigo-500 text-white" 
                                    : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                                )}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="pt-4">
                    <button 
                      onClick={saveSettings}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/30 group"
                    >
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Commit Configuration
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'memory' && (
                <motion.div 
                  key="memory"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-full flex flex-col p-8 gap-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <Database className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Neural Memory Profile</h3>
                          <p className="text-xs text-slate-500">Persistent context for automated interactions</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                        Active Profile
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                      <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-3">
                        <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        This profile is used by the <span className="text-rose-400 font-bold">Red Agent</span> to automatically fill forms and surveys. Ensure the data is accurate for consistent behavior.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 relative group">
                    <textarea 
                      value={profile}
                      onChange={(e) => setProfile(e.target.value)}
                      className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none leading-loose custom-scrollbar shadow-inner"
                    />
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-700 pointer-events-none">
                      EDITABLE_BUFFER
                    </div>
                  </div>

                  <button 
                    onClick={saveProfile}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/30 group"
                  >
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Sync Neural Memory
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </div>
  );
}
