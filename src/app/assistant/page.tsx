"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Send, Bot, User as UserIcon, Loader2, Sparkles,
  RefreshCcw, CheckCircle2, Volume2, VolumeX, Wifi,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ElectionStep } from "@/lib/gemini";
import { VotingPlanCard } from "@/components/plan/VotingPlanCard";
import { VoiceAssistantControls } from "@/components/assistant/VoiceAssistantControls";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type Message = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  steps?: ElectionStep[];
  suggestedPlanUpdate?: ElectionStep[] | null;
  planUpdated?: boolean;
  isStreaming?: boolean;
  streamedText?: string;
};

// Lightweight history entry sent to the backend for multi-turn chat
type HistoryEntry = { role: "user" | "model"; text: string };

export default function AssistantPage() {
  const { profile, updateProfile } = useUser();
  const {
    speak, stop, isSpeaking, currentlySpeakingId,
    isSupported: isSynthesisSupported,
  } = useSpeechSynthesis();

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I\u2019m VoteWise AI \u2014 powered by Gemini with live search grounding. I remember our entire conversation, so feel free to ask follow-ups. Describe your situation and I\u2019ll give you real, actionable guidance.",
    },
  ]);
  const [chatHistory, setChatHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const quickActions = [
    "I lost my voter ID",
    "I moved to a new city",
    "I\u2019m voting for the first time",
  ];

  const handleQuickAction = (action: string) => {
    setQuery(action);
    setTimeout(() => {
      document.getElementById("chat-form")?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }, 100);
  };

  const handleVoiceTranscript = (text: string) => {
    setQuery(text);
    if (text.trim().split(" ").length > 3) {
      setTimeout(() => {
        document.getElementById("chat-form")?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }, 500);
    }
  };

  const handleReadAloud = (msg: Message) => {
    if (isSpeaking && currentlySpeakingId === msg.id) { stop(); return; }
    let summary = "";
    if (msg.text) summary += msg.text + ". ";
    if (msg.steps?.length) {
      summary += "Here are your steps. ";
      msg.steps.forEach((s, i) => { summary += `Step ${i + 1}: ${s.action}. `; });
      summary += "Please verify with official authorities.";
    }
    speak(summary, msg.id);
  };

  const applyPlanUpdate = (msgId: string, updatedPlan: ElectionStep[]) => {
    updateProfile({ votingPlan: updatedPlan });
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, planUpdated: true } : m)));
  };

  // ── Core submit handler with SSE streaming ──────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent | Event) => {
      e.preventDefault();
      if (!query.trim() || isLoading) return;
      if (isSpeaking) stop();

      const currentQuery = query;
      const userMsg: Message = { id: Date.now().toString(), role: "user", text: currentQuery };
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", isStreaming: true, streamedText: "" },
      ]);
      setQuery("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: currentQuery, profile, history: chatHistory }),
        });

        if (!res.ok || !res.body) throw new Error("Request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, streamedText: accumulated } : m
                  )
                );
              }
            } catch {
              // ignore partial JSON
            }
          }
        }

        // Parse the fully accumulated JSON response
        let finalData;
        try {
          const clean = accumulated.replace(/```json/g, "").replace(/```/g, "").trim();
          finalData = JSON.parse(clean);
        } catch {
          finalData = {
            adviceSteps: [{
              id: "parse-err", title: "Response Error",
              action: "The AI returned an unexpected format. Please try again.",
              reasoning: accumulated.slice(0, 200),
              confidence: "Low" as const,
            }],
          };
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  isStreaming: false,
                  streamedText: undefined,
                  steps: finalData.adviceSteps,
                  suggestedPlanUpdate: finalData.suggestedPlanUpdate,
                }
              : m
          )
        );

        // Persist to chat history for multi-turn
        setChatHistory((prev) => [
          ...prev,
          { role: "user", text: currentQuery },
          { role: "model", text: accumulated },
        ]);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, streamedText: undefined, text: "Sorry, something went wrong. Please try again." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [query, isLoading, profile, chatHistory, isSpeaking, stop]
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <Wifi className="h-3 w-3" /> Grounded
          </span>
        </div>
        <p className="text-muted-foreground">
          Multi-turn conversational AI with live search grounding. Ask follow-up questions naturally.
        </p>
      </div>

      <VotingPlanCard />

      {/* Chat Card */}
      <Card className="flex flex-col overflow-hidden glass border-primary/20 min-h-[500px] h-[60vh]">
        <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.role === "user" ? <UserIcon size={20} /> : <Bot size={20} />}
                </div>

                {/* Content */}
                <div className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>

                  {/* Read aloud button */}
                  {msg.role === "assistant" && msg.id !== "welcome" && !msg.isStreaming && isSynthesisSupported && (
                    <div className="flex justify-end mb-2">
                      <Button variant="ghost" size="sm"
                        onClick={() => handleReadAloud(msg)}
                        className={`text-xs h-7 rounded-full px-3 ${
                          isSpeaking && currentlySpeakingId === msg.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        }`}
                        aria-label={isSpeaking && currentlySpeakingId === msg.id ? "Stop voice" : "Read aloud"}
                      >
                        {isSpeaking && currentlySpeakingId === msg.id
                          ? <><VolumeX className="h-3 w-3 mr-1.5" /> Stop voice</>
                          : <><Volume2 className="h-3 w-3 mr-1.5" /> Read aloud</>}
                      </Button>
                    </div>
                  )}

                  {/* Streaming indicator */}
                  {msg.isStreaming && (
                    <div className="bg-secondary text-secondary-foreground rounded-2xl px-5 py-4 text-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs font-semibold text-primary animate-pulse">Streaming response…</span>
                      </div>
                      {msg.streamedText && (
                        <div className="font-mono text-xs opacity-60 max-h-24 overflow-hidden">
                          {msg.streamedText.slice(-200)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plain text message */}
                  {msg.text && !msg.isStreaming && (
                    <div className={`inline-block rounded-2xl px-5 py-3 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {msg.text}
                    </div>
                  )}

                  {/* Structured step cards */}
                  {msg.steps && (
                    <div className="space-y-4">
                      {msg.steps.map((step, i) => (
                        <Card key={i} className="bg-background shadow-sm border-border">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {i + 1}
                              </span>
                              <CardTitle className="text-base">{step.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-3">
                            <div className="bg-secondary/50 p-3 rounded-md text-sm">
                              <span className="font-semibold text-foreground mr-1">Action:</span>
                              <span className="text-foreground/90">{step.action}</span>
                            </div>
                            <div className="bg-primary/5 p-3 rounded-md text-sm border border-primary/10">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-primary">Why:</span>
                                {step.confidence && (
                                  <span className="text-[10px] uppercase font-bold text-primary">
                                    {step.confidence} Confidence
                                  </span>
                                )}
                              </div>
                              <span className="text-foreground/80">{step.reasoning}</span>
                            </div>
                            {step.source && (
                              <div className="text-xs text-muted-foreground italic">
                                Source: {step.source}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Plan update suggestion */}
                  {msg.suggestedPlanUpdate && msg.suggestedPlanUpdate.length > 0 && (
                    <div className="mt-4 bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col items-start gap-3">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Sparkles className="h-5 w-5" />
                        <span>Plan Update Suggested</span>
                      </div>
                      <p className="text-sm text-foreground/80 text-left">
                        Based on this new information, your voting plan should be updated.
                      </p>
                      {msg.planUpdated ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-500/10 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="h-4 w-4" /> Plan Updated Successfully
                        </div>
                      ) : (
                        <Button onClick={() => applyPlanUpdate(msg.id, msg.suggestedPlanUpdate!)} size="sm" className="w-full sm:w-auto">
                          <RefreshCcw className="h-4 w-4 mr-2" /> Update My Voting Plan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>

        {/* Input bar */}
        <div className="p-4 bg-background border-t space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickActions.map((action) => (
              <button key={action} onClick={() => handleQuickAction(action)}
                className="whitespace-nowrap flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors border border-border">
                {action}
              </button>
            ))}
          </div>
          <form id="chat-form" onSubmit={handleSubmit} className="flex gap-2 items-center">
            <VoiceAssistantControls onTranscript={handleVoiceTranscript} disabled={isLoading} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a follow-up or describe your situation…"
              className="flex-1 rounded-full px-6" disabled={isLoading} />
            <Button type="submit" size="icon" className="rounded-full flex-shrink-0 h-10 w-10"
              disabled={isLoading || !query.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
