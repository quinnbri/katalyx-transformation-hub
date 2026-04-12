import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AssessmentProgress, { type DomainProgress } from "@/components/agent/AssessmentProgress";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  signal,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed (${resp.status})`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        done = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}

function parseActions(text: string): { action: string; framework?: string; assessment_id?: string; data?: Record<string, any>; domains?: any[] }[] {
  const regex = /\{"action"\s*:\s*"[^"]*"[^}]*(?:\{[^}]*\}[^}]*)?\}/g;
  const results: any[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      results.push(JSON.parse(match[0]));
    } catch {
      // Try with nested objects by finding balanced braces
      try {
        let depth = 0;
        let start = match.index;
        let end = start;
        for (let i = start; i < text.length; i++) {
          if (text[i] === '{') depth++;
          if (text[i] === '}') depth--;
          if (depth === 0) { end = i + 1; break; }
        }
        results.push(JSON.parse(text.slice(start, end)));
      } catch { /* skip */ }
    }
  }
  return results;
}

function cleanContent(text: string): string {
  // Remove all JSON action blocks (including nested ones like metadata)
  let cleaned = text;
  const regex = /\{"action"\s*:\s*"/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    let depth = 0;
    let start = match.index;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      if (cleaned[i] === '}') depth--;
      if (depth === 0) {
        cleaned = cleaned.slice(0, start) + cleaned.slice(i + 1);
        regex.lastIndex = start;
        break;
      }
    }
  }
  return cleaned.trim();
}

function saveMetadata(data: Record<string, any>) {
  const existing = JSON.parse(localStorage.getItem("katalyx_user_metadata") || "{}");
  const merged = { ...existing, ...data };
  localStorage.setItem("katalyx_user_metadata", JSON.stringify(merged));
}

export default function Agent() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [assessmentFramework, setAssessmentFramework] = useState<string | null>(null);
  const [domainProgress, setDomainProgress] = useState<DomainProgress[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-start conversation
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConversation = async () => {
    setIsLoading(true);
    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [{ role: "user", content: "Hello, I'd like to start a transformation assessment." }],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ title: "Connection error", description: e.message, variant: "destructive" });
    }
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages,
        onDelta: upsert,
        onDone: () => {
          setIsLoading(false);
          // Process all action directives
          const actions = parseActions(assistantSoFar);
          for (const action of actions) {
            if (action.action === "update_metadata" && action.data) {
              saveMetadata(action.data);
            } else if (action.action === "update_progress" && action.domains) {
              setAssessmentFramework(action.framework || null);
              setDomainProgress(action.domains as DomainProgress[]);
            } else if (action.action === "redirect_to_assessment" && action.framework) {
              setTimeout(() => navigate(`/assessment/${action.framework}`), 1500);
            } else if (action.action === "redirect_to_results" && action.assessment_id) {
              setTimeout(() => navigate(`/results/${action.assessment_id}`), 1500);
            }
          }
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [input, isLoading, messages, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-screen agent-refraction-bg text-foreground antialiased relative">
      {/* Ambient background orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />

      {/* Header */}
      <nav className="sticky top-0 z-50 h-16 agent-glass-card flex items-center justify-between px-8 border-b border-border/20">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            KATALYX
          </span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 border border-border/30 text-sm font-medium text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Assessment Advisor</span>
        </div>
      </nav>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto pt-10 pb-48 px-6 space-y-10">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 animate-fade-in ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Label */}
              <div className={`flex items-center gap-3 px-1 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
                  {msg.role === "user" ? "You" : "Katalyx"}
                </span>
                <div className="h-px w-8 bg-border/30" />
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[88%] px-6 py-4 ${
                  msg.role === "user"
                    ? "bg-foreground text-background rounded-[2rem] rounded-tr-lg shadow-xl shadow-foreground/5"
                    : "agent-message-ai rounded-[2rem] rounded-tl-lg"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-lg dark:prose-invert max-w-none [&>p]:mb-3 [&>p:last-child]:mb-0 [&>p]:leading-relaxed">
                    <ReactMarkdown>{cleanContent(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-lg leading-relaxed font-light">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex flex-col gap-3 items-start animate-fade-in">
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">Katalyx</span>
                <div className="h-px w-8 bg-border/30" />
              </div>
              <div className="agent-message-ai rounded-[2rem] rounded-tl-lg px-6 py-5">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-10 inset-x-0 px-6 pointer-events-none z-40">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="agent-glass-card rounded-[2.5rem] p-2 flex items-end ring-1 ring-border/20 agent-input-glow">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none py-4 px-4 text-lg resize-none min-h-[56px] max-h-48 placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={send}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="mb-1 w-12 h-12 rounded-full bg-primary text-primary-foreground shrink-0 shadow-lg"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-4 text-center text-[10px] tracking-widest uppercase text-muted-foreground/30">
            Katalyx AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
