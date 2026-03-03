"use client";

const metrics = [
  { label: "API Latency (avg)", value: "142ms", status: "healthy", icon: "speed" },
  { label: "API Latency (p95)", value: "387ms", status: "healthy", icon: "speed" },
  { label: "Uptime", value: "99.97%", status: "healthy", icon: "check_circle" },
  { label: "Error Rate", value: "0.12%", status: "healthy", icon: "error" },
  { label: "DB Connections", value: "24/100", status: "healthy", icon: "storage" },
  { label: "Memory Usage", value: "68%", status: "warning", icon: "memory" },
  { label: "CPU Usage", value: "42%", status: "healthy", icon: "developer_board" },
  { label: "Docker Containers", value: "3/10", status: "healthy", icon: "deployed_code" },
];

const recentLogs = [
  { time: "14:32:05", level: "info", message: "Interview session #892 started for candidate john@email.com" },
  { time: "14:31:58", level: "info", message: "AI evaluation completed for session #891 in 2.3s" },
  { time: "14:31:22", level: "warning", message: "LLM response required retry - invalid JSON on first attempt" },
  { time: "14:30:45", level: "info", message: "Code sandbox allocated for session #892 (JavaScript)" },
  { time: "14:29:33", level: "info", message: "New user registration: alex@email.com (candidate)" },
  { time: "14:28:10", level: "error", message: "Sandbox timeout for execution #4521 - exceeded 5s limit" },
  { time: "14:27:00", level: "info", message: "Interview session #891 completed - 5/5 questions answered" },
];

export default function AdminMetricsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Metrics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time platform health and performance monitoring</p>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="material-symbols-outlined text-slate-400">{m.icon}</span>
              <span className={`size-2.5 rounded-full ${m.status === "healthy" ? "bg-green-500" : m.status === "warning" ? "bg-amber-500" : "bg-red-500"}`}></span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* System Logs */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-white">Recent System Logs</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-600">Live</span>
          </div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {recentLogs.map((log, i) => (
            <div key={i} className="px-5 py-3 flex items-start gap-4 font-mono text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <span className="text-slate-400 shrink-0">{log.time}</span>
              <span className={`font-bold uppercase shrink-0 w-16 ${
                log.level === "error" ? "text-red-500" :
                log.level === "warning" ? "text-amber-500" :
                "text-green-500"
              }`}>{log.level}</span>
              <span className="text-slate-600 dark:text-slate-400">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
