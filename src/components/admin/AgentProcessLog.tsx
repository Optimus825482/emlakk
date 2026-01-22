"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Cpu,
  Search,
  Share2,
  Database,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AgentLog {
  id: string;
  type: "thought" | "action" | "result";
  agent: string;
  content: string;
  timestamp: Date;
}

interface AgentProcessLogProps {
  logs: AgentLog[];
  isVisible: boolean;
}

export function AgentProcessLog({ logs, isVisible }: AgentProcessLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible && logs.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-black/80 border-b border-yellow-600/20 backdrop-blur-md overflow-hidden"
        >
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-500" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-green-500/80 font-mono">
                Sistem Protokolü
              </span>
            </div>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500/20 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-yellow-500/20 animate-pulse delay-75" />
              <span className="w-2 h-2 rounded-full bg-green-500/20 animate-pulse delay-150" />
            </div>
          </div>

          <div
            ref={scrollRef}
            className="max-h-[200px] overflow-y-auto p-4 space-y-3 font-mono text-xs"
          >
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3"
              >
                <div className="shrink-0 pt-1">
                  {getIconForLogType(log.type, log.agent)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "uppercase font-bold tracking-wider text-[10px]",
                        getAgentColor(log.agent),
                      )}
                    >
                      {log.agent}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {log.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                    {log.content}
                  </p>
                </div>
              </motion.div>
            ))}

            <div className="flex items-center gap-2 text-zinc-600 pl-7 pt-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px]">İşleniyor...</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getIconForLogType(type: string, agent: string) {
  if (agent.includes("Miner"))
    return <Database className="w-4 h-4 text-blue-400" />;
  if (agent.includes("Content"))
    return <Share2 className="w-4 h-4 text-pink-400" />;

  switch (type) {
    case "thought":
      return <Cpu className="w-4 h-4 text-purple-400" />;
    case "action":
      return <Search className="w-4 h-4 text-yellow-400" />;
    case "result":
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    default:
      return <Terminal className="w-4 h-4 text-zinc-400" />;
  }
}

function getAgentColor(agent: string) {
  if (agent.includes("Miner")) return "text-blue-400";
  if (agent.includes("Content")) return "text-pink-400";
  if (agent.includes("Maestro")) return "text-yellow-500";
  return "text-zinc-400";
}
