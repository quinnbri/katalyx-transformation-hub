import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

function parseActions(text: string): { action: string; framework?: string; assessment_id?: string; data?: Record<string, any> }[] {
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
          // Check for action directives
          const action = parseActions(assistantSoFar);
          if (action?.action === "redirect_to_assessment" && action.framework) {
            setTimeout(() => navigate(`/assessment/${action.framework}`), 1500);
          } else if (action?.action === "redirect_to_results" && action.assessment_id) {
            setTimeout(() => navigate(`/results/${action.assessment_id}`), 1500);
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent"></div>
            <span className="text-xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              KATALYX
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span>AI Assessment Advisor</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                    <ReactMarkdown>{cleanContent(msg.content)}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="container max-w-3xl py-4">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
              rows={1}
              disabled={isLoading}
            />
            <Button
              onClick={send}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-xl h-[44px] w-[44px] shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Katalyx AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
