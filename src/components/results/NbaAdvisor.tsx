import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
// The NBA tables are defined in a new migration; generated types haven't been
// regenerated in this branch yet. Cast to an untyped client for these reads
// and writes so the UI compiles. Row shapes are validated by the interfaces
// declared below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Bot,
} from "lucide-react";
import { extractText } from "@/lib/document-extract";
import { downloadMarkdownAsDocx } from "@/lib/generate-docx";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

interface RoadmapItem {
  priority: number;
  action: string;
  domain: string;
  effort: string;
  impact: string;
  timeline: string;
}

interface ProposedTask {
  id: string;
  title: string;
  description: string | null;
  owner_role: string | null;
  effort_days: number | null;
  outcome: string | null;
  accepted: boolean;
  dismissed: boolean;
  position: number;
}

interface GeneratedStrategy {
  id: string;
  title: string;
  domain: string | null;
  markdown: string;
  created_at: string;
}

interface NbaAdvisorProps {
  assessmentId: string;
  framework: string;
  overallScore: number;
  domainScores: Record<string, unknown>;
  roadmap: RoadmapItem[];
}

interface AdvisorAction {
  action: string;
  domain?: string;
  title?: string;
  markdown?: string;
  epic?: string;
  tasks?: {
    title: string;
    description?: string;
    owner_role?: string;
    effort_days?: number;
    outcome?: string;
  }[];
}

const ADVISOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nba-advisor`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Strip JSON action blocks from rendered chat text
function cleanContent(text: string): string {
  let cleaned = text;
  const regex = /\{"action"\s*:\s*"/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    let depth = 0;
    const start = match.index;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      if (cleaned[i] === "}") depth--;
      if (depth === 0) {
        cleaned = cleaned.slice(0, start) + cleaned.slice(i + 1);
        regex.lastIndex = start;
        break;
      }
    }
  }
  return cleaned.trim();
}

// Pull all balanced-brace {"action":...} payloads out of a streamed message
function parseActions(text: string): AdvisorAction[] {
  const results: AdvisorAction[] = [];
  const regex = /\{"action"\s*:\s*"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let depth = 0;
    const start = match.index;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      if (depth === 0) {
        try {
          results.push(JSON.parse(text.slice(start, i + 1)));
        } catch {
          /* skip malformed */
        }
        break;
      }
    }
  }
  return results;
}

export default function NbaAdvisor({
  assessmentId,
  framework,
  overallScore,
  domainScores,
  roadmap,
}: NbaAdvisorProps) {
  const { user } = useAuth();

  // Which roadmap item is selected
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedEpic = useMemo(
    () => (selectedIdx !== null ? roadmap[selectedIdx] : null),
    [selectedIdx, roadmap],
  );

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [epicAddressed, setEpicAddressed] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [proposedTasks, setProposedTasks] = useState<ProposedTask[]>([]);
  const [strategies, setStrategies] = useState<GeneratedStrategy[]>([]);
  const [awaitingStrategyUpload, setAwaitingStrategyUpload] = useState(false);

  const [pendingStrategyText, setPendingStrategyText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, proposedTasks.length, strategies.length]);

  // Load or create a session when a roadmap item is selected
  useEffect(() => {
    if (selectedIdx === null || !user || !selectedEpic) return;
    let cancelled = false;

    (async () => {
      setSessionLoading(true);
      setMessages([]);
      setProposedTasks([]);
      setStrategies([]);
      setAwaitingStrategyUpload(false);
      setEpicAddressed(false);

      // Try to load existing session
      const { data: existing } = await sb
        .from("nba_advisor_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("assessment_id", assessmentId)
        .eq("roadmap_item_index", selectedIdx)
        .maybeSingle();

      let sid = existing?.id as string | undefined;
      if (!sid) {
        const { data: created, error } = await sb
          .from("nba_advisor_sessions")
          .insert({
            user_id: user.id,
            assessment_id: assessmentId,
            roadmap_item_index: selectedIdx,
            epic_action: selectedEpic.action,
            domain: selectedEpic.domain,
            messages: [],
          })
          .select("*")
          .single();
        if (error || !created) {
          if (!cancelled) {
            toast({
              title: "Couldn't start advisor session",
              description: error?.message ?? "Please try again.",
              variant: "destructive",
            });
            setSessionLoading(false);
          }
          return;
        }
        sid = created.id;
      } else {
        const existingMessages = (existing?.messages ?? []) as Msg[];
        if (!cancelled) {
          setMessages(existingMessages);
          setEpicAddressed(!!existing?.epic_addressed);
        }
      }

      if (cancelled || !sid) return;
      setSessionId(sid);

      // Load any previously proposed tasks and strategies
      const [{ data: tasks }, { data: strats }] = await Promise.all([
        sb
          .from("nba_proposed_tasks")
          .select("*")
          .eq("session_id", sid)
          .order("position", { ascending: true }),
        sb
          .from("nba_generated_strategies")
          .select("*")
          .eq("session_id", sid)
          .order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setProposedTasks((tasks as ProposedTask[]) ?? []);
      setStrategies((strats as GeneratedStrategy[]) ?? []);
      setSessionLoading(false);

      // Auto-kick the conversation if this is a fresh session
      if ((existing?.messages as Msg[] | undefined)?.length) {
        // Already has history; don't re-kick
      } else {
        void streamTurn(
          sid,
          [
            {
              role: "user",
              content:
                "Hi — I'd like your help working through this roadmap action.",
            },
          ],
          [],
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx, assessmentId, user?.id]);

  // Persist messages + epic_addressed back to Supabase (debounced via effect)
  const persistSession = useCallback(
    async (
      sid: string,
      nextMessages: Msg[],
      flags?: { epic_addressed?: boolean },
    ) => {
      await sb
        .from("nba_advisor_sessions")
        .update({
          messages: nextMessages as unknown as object,
          ...(flags?.epic_addressed !== undefined
            ? { epic_addressed: flags.epic_addressed }
            : {}),
        })
        .eq("id", sid);
    },
    [],
  );

  // Core: run one assistant turn, streaming SSE from nba-advisor edge fn
  const streamTurn = useCallback(
    async (sid: string, turnMessages: Msg[], baseMessages: Msg[]) => {
      if (!selectedEpic || !user) return;

      setIsStreaming(true);
      let assistantSoFar = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      const context = {
        framework,
        overall_score: overallScore,
        domain_scores: domainScores,
        epic: selectedEpic,
      };

      try {
        const resp = await fetch(ADVISOR_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [...baseMessages, ...turnMessages],
            context,
          }),
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
          const { done: sd, value } = await reader.read();
          if (sd) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
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
              const delta = parsed.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta) upsert(delta);
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Build final message list and persist
        const userMsgs = turnMessages;
        const finalMessages: Msg[] = [
          ...baseMessages,
          ...userMsgs,
          { role: "assistant", content: assistantSoFar },
        ];
        setMessages(finalMessages);

        // Interpret advisor actions
        const actions = parseActions(assistantSoFar);
        let markAddressed = false;
        for (const a of actions) {
          if (a.action === "request_strategy_upload") {
            setAwaitingStrategyUpload(true);
          } else if (a.action === "propose_strategy" && a.markdown) {
            await handleProposedStrategy(sid, a);
          } else if (a.action === "propose_tasks" && a.tasks) {
            await handleProposedTasks(sid, a.tasks);
          } else if (a.action === "mark_epic_addressed") {
            markAddressed = true;
            setEpicAddressed(true);
          }
        }

        await persistSession(sid, finalMessages, {
          epic_addressed: markAddressed ? true : undefined,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        toast({
          title: "Advisor error",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
        textareaRef.current?.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedEpic, user?.id, framework, overallScore, domainScores, persistSession],
  );

  const handleProposedStrategy = async (
    sid: string,
    a: AdvisorAction,
  ) => {
    if (!user || !a.markdown || !a.title) return;
    const { data, error } = await sb
      .from("nba_generated_strategies")
      .insert({
        session_id: sid,
        user_id: user.id,
        domain: a.domain ?? selectedEpic?.domain ?? null,
        title: a.title,
        markdown: a.markdown,
      })
      .select("*")
      .single();
    if (error) {
      toast({
        title: "Couldn't save strategy",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    if (data) setStrategies((prev) => [...prev, data as GeneratedStrategy]);
  };

  const handleProposedTasks = async (
    sid: string,
    tasks: NonNullable<AdvisorAction["tasks"]>,
  ) => {
    if (!user) return;
    const payload = tasks.map((t, i) => ({
      session_id: sid,
      user_id: user.id,
      title: t.title,
      description: t.description ?? null,
      owner_role: t.owner_role ?? null,
      effort_days: t.effort_days ?? null,
      outcome: t.outcome ?? null,
      position: i,
    }));
    const { data, error } = await sb
      .from("nba_proposed_tasks")
      .insert(payload)
      .select("*");
    if (error) {
      toast({
        title: "Couldn't save proposed tasks",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    if (data) setProposedTasks((prev) => [...prev, ...(data as ProposedTask[])]);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) return;
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: Msg = { role: "user", content: trimmed };
      const base = [...messages];
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      await streamTurn(sessionId, [userMsg], base);
    },
    [sessionId, isStreaming, messages, streamTurn],
  );

  const handleFileUpload = async (file: File) => {
    if (!sessionId) return;
    try {
      const { text, warning } = await extractText(file);
      if (!text) {
        toast({
          title: "No text extracted",
          description:
            warning ??
            "We couldn't pull text from that file. Try a .pdf, .docx, .pptx, or paste it below.",
          variant: "destructive",
        });
        return;
      }
      if (warning) {
        toast({ title: "Note", description: warning });
      }
      setAwaitingStrategyUpload(false);
      const msg = `STRATEGY_DOC: ${file.name}\n\n${text}`;
      await sendMessage(msg);
    } catch (e: unknown) {
      toast({
        title: "File read failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handlePasteStrategy = async () => {
    const text = pendingStrategyText.trim();
    if (!text) return;
    setPendingStrategyText("");
    setAwaitingStrategyUpload(false);
    await sendMessage(`STRATEGY_DOC: (pasted)\n\n${text}`);
  };

  const handleTaskAccept = async (taskId: string, accepted: boolean) => {
    setProposedTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, accepted, dismissed: accepted ? false : t.dismissed }
          : t,
      ),
    );
    await sb
      .from("nba_proposed_tasks")
      .update({ accepted, dismissed: accepted ? false : undefined })
      .eq("id", taskId);
  };

  const handleTaskDismiss = async (taskId: string) => {
    setProposedTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, accepted: false, dismissed: true } : t,
      ),
    );
    await sb
      .from("nba_proposed_tasks")
      .update({ accepted: false, dismissed: true })
      .eq("id", taskId);
  };

  const handleStrategyDownload = async (strategy: GeneratedStrategy) => {
    try {
      await downloadMarkdownAsDocx({
        title: strategy.title,
        subtitle: strategy.domain ? `KATALYX • ${strategy.domain}` : "KATALYX",
        markdown: strategy.markdown,
      });
    } catch (e: unknown) {
      toast({
        title: "Download failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <Card className="mb-8 overflow-hidden border-primary/30">
      <CardHeader className="border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Next Best Action Advisor</CardTitle>
            <p className="text-xs text-muted-foreground">
              AI delivery consultant · picks an action, drafts the plan, captures tasks
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Roadmap picker */}
        <div className="border-b bg-muted/30 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pick an action to work on
          </p>
          <div className="flex flex-wrap gap-2">
            {roadmap
              .slice()
              .sort((a, b) => a.priority - b.priority)
              .map((item, i) => {
                const isActive = selectedIdx === i;
                return (
                  <button
                    key={`${item.priority}-${i}`}
                    onClick={() => setSelectedIdx(i)}
                    className={`group flex max-w-xs items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                    title={item.action}
                  >
                    <span className="font-bold text-primary">
                      #{item.priority}
                    </span>
                    <span className="flex-1 line-clamp-2">{item.action}</span>
                    {isActive && <ChevronRight className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Body */}
        {selectedIdx === null ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Bot className="h-10 w-10 text-muted-foreground/60" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Choose any roadmap item above. I'll walk through it like a senior
              consultant — check for strategy, break it into tasks, and capture
              what you want to own.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Session header */}
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {selectedEpic?.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedEpic?.domain} · {selectedEpic?.timeline} ·{" "}
                  {selectedEpic?.effort} effort / {selectedEpic?.impact} impact
                </p>
              </div>
              {epicAddressed && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Worked through
                </Badge>
              )}
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="max-h-[520px] min-h-[300px] overflow-y-auto bg-muted/20 p-4"
            >
              {sessionLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => {
                    const text = cleanContent(m.content);
                    if (!text) return null;
                    return (
                      <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            m.role === "user"
                              ? "rounded-tr-sm bg-primary text-primary-foreground"
                              : "rounded-tl-sm bg-background"
                          }`}
                        >
                          {m.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                              <ReactMarkdown>{text}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isStreaming &&
                    messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex justify-start">
                        <div className="flex gap-1.5 rounded-2xl rounded-tl-sm bg-background px-4 py-3 shadow-sm">
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" />
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Strategy upload panel */}
            {awaitingStrategyUpload && (
              <div className="border-t bg-accent/5 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                  Share your strategy
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-background p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Upload className="h-4 w-4" /> Upload a file
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      .pdf, .docx, .pptx, or .txt — we extract the text locally.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.pptx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFileUpload(f);
                        e.target.value = "";
                      }}
                      className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                    />
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" /> Paste the text
                    </div>
                    <Textarea
                      value={pendingStrategyText}
                      onChange={(e) => setPendingStrategyText(e.target.value)}
                      placeholder="Paste your strategy, policy, or charter here..."
                      rows={4}
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={handlePasteStrategy}
                      disabled={!pendingStrategyText.trim() || isStreaming}
                    >
                      Send to advisor
                    </Button>
                  </div>
                </div>
                <button
                  onClick={() => setAwaitingStrategyUpload(false)}
                  className="mt-2 text-xs text-muted-foreground hover:underline"
                >
                  Skip — I don't have one
                </button>
              </div>
            )}

            {/* Proposed tasks */}
            {proposedTasks.length > 0 && (
              <div className="border-t bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Proposed tasks
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {proposedTasks.filter((t) => t.accepted).length}/
                    {proposedTasks.length} accepted
                  </span>
                </div>
                <div className="space-y-2">
                  {proposedTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-lg border p-3 transition ${
                        t.accepted
                          ? "border-green-500/40 bg-green-500/5"
                          : t.dismissed
                            ? "border-border bg-muted/30 opacity-60"
                            : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{t.title}</p>
                          {t.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                            {t.owner_role && (
                              <Badge variant="outline">{t.owner_role}</Badge>
                            )}
                            {t.effort_days != null && (
                              <Badge variant="outline">
                                ~{t.effort_days}d
                              </Badge>
                            )}
                            {t.outcome && (
                              <Badge variant="secondary" className="max-w-xs truncate">
                                {t.outcome}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant={t.accepted ? "default" : "outline"}
                            className="h-7 w-7"
                            onClick={() => handleTaskAccept(t.id, !t.accepted)}
                            title={t.accepted ? "Unaccept" : "Accept"}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleTaskDismiss(t.id)}
                            title="Dismiss"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated strategies */}
            {strategies.length > 0 && (
              <div className="border-t bg-background p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Drafted strategies
                </p>
                <div className="space-y-3">
                  {strategies.map((s) => (
                    <details
                      key={s.id}
                      className="group rounded-lg border bg-muted/20"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {s.title}
                          </p>
                          {s.domain && (
                            <p className="text-xs text-muted-foreground">
                              {s.domain} ·{" "}
                              {new Date(s.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1.5"
                          onClick={(e) => {
                            e.preventDefault();
                            void handleStrategyDownload(s);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          .docx
                        </Button>
                      </summary>
                      <div className="prose prose-sm dark:prose-invert max-w-none border-t bg-background p-4">
                        <ReactMarkdown>{s.markdown}</ReactMarkdown>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t bg-background p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    awaitingStrategyUpload
                      ? "Or just type your answer..."
                      : "Reply to the advisor..."
                  }
                  rows={1}
                  className="min-h-[44px] max-h-40 flex-1 resize-none text-sm"
                  disabled={isStreaming || sessionLoading}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isStreaming || sessionLoading}
                  className="h-11 w-11 shrink-0 rounded-full"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
