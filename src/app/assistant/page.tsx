"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, RefreshCcw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ElectionStep } from "@/lib/gemini";
import { VotingPlanCard } from "@/components/plan/VotingPlanCard";

type Message = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  steps?: ElectionStep[];
  suggestedPlanUpdate?: ElectionStep[] | null;
  planUpdated?: boolean;
};

export default function AssistantPage() {
  const { profile, updateProfile } = useUser();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm VoteWise AI. Tell me your situation or ask a question about the election process, and I'll give you a step-by-step action plan.",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    "I'm a first-time voter",
    "I lost my voter ID",
    "I moved to a new city",
    "I missed registration",
  ];

  const handleQuickAction = (action: string) => {
    setQuery(action);
    // We don't auto-submit immediately so the user sees it populate, but let's just auto submit for better demo flow
    setTimeout(() => {
      document.getElementById("chat-form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 100);
  };

  const applyPlanUpdate = (msgId: string, updatedPlan: ElectionStep[]) => {
    updateProfile({ votingPlan: updatedPlan });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, planUpdated: true } : m));
  };

  const handleSubmit = async (e: React.FormEvent | Event) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.text, profile }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { 
          id: Date.now().toString(), 
          role: "assistant", 
          steps: data.adviceSteps,
          suggestedPlanUpdate: data.suggestedPlanUpdate
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", text: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Describe your scenario (e.g., "I just moved," "I lost my ID") for structured, actionable advice.
        </p>
      </div>

      <VotingPlanCard />

      <Card className="flex flex-col overflow-hidden glass border-primary/20 min-h-[500px] h-[60vh]">
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {msg.role === "user" ? <UserIcon size={20} /> : <Bot size={20} />}
                </div>

                <div className={`flex-1 max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                  {msg.text && (
                    <div className={`inline-block rounded-2xl px-5 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {msg.text}
                    </div>
                  )}

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
                                  <span className="text-[10px] uppercase font-bold text-primary">{step.confidence} Confidence</span>
                                )}
                              </div>
                              <span className="text-foreground/80">{step.reasoning}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {msg.suggestedPlanUpdate && msg.suggestedPlanUpdate.length > 0 && (
                    <div className="mt-4 bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col items-start gap-3">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Sparkles className="h-5 w-5" />
                        <span>Plan Update Suggested</span>
                      </div>
                      <p className="text-sm text-foreground/80 text-left">
                        Based on this new information, your voting plan should be updated to ensure you meet all requirements.
                      </p>
                      {msg.planUpdated ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-500/10 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="h-4 w-4" /> Plan Updated Successfully
                        </div>
                      ) : (
                        <Button 
                          onClick={() => applyPlanUpdate(msg.id, msg.suggestedPlanUpdate!)} 
                          size="sm" 
                          className="w-full sm:w-auto"
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Update My Voting Plan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="bg-secondary text-secondary-foreground inline-flex rounded-2xl px-5 py-3 items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Analyzing scenario...</span>
              </div>
            </motion.div>
          )}
        </CardContent>

        <div className="p-4 bg-background border-t space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="whitespace-nowrap flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors border border-border"
              >
                {action}
              </button>
            ))}
          </div>
          <form id="chat-form" onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., I just moved to a new city, what do I do?"
              className="flex-1 rounded-full px-6"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="rounded-full flex-shrink-0 h-10 w-10" disabled={isLoading || !query.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
