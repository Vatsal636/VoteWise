"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, Sparkles, TrendingUp, TrendingDown,
  ArrowRight, Activity, AlertTriangle, Loader2,
} from "lucide-react";
import Link from "next/link";
import { ImpactResponse } from "@/lib/gemini";

const AVAILABLE_ISSUES = [
  "Climate & Environment",
  "Education",
  "Jobs & Economy",
  "Infrastructure",
  "Healthcare",
  "Public Safety",
  "Digital Rights & Privacy",
  "Housing & Affordability",
];

export default function ImpactSimulatorPage() {
  const { profile, updateProfile } = useUser();
  const [localIssues, setLocalIssues] = useState<string[]>(profile.selectedIssues || []);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<ImpactResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!profile.hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <Sparkles className="h-12 w-12 text-primary opacity-50" />
        <h1 className="text-3xl font-bold tracking-tight">Civic Impact Simulator</h1>
        <p className="text-muted-foreground max-w-md">
          Please complete your basic profile first so we can tailor the impact simulation to your demographic and location.
        </p>
        <Link href="/guide">
          <Button size="lg" className="rounded-full mt-4">Complete Profile</Button>
        </Link>
      </div>
    );
  }

  const toggleIssue = (issue: string) => {
    setLocalIssues((prev) => {
      if (prev.includes(issue)) return prev.filter((i) => i !== issue);
      if (prev.length >= 3) return prev;
      return [...prev, issue];
    });
  };

  const handleGenerate = async () => {
    if (localIssues.length < 2) return;
    updateProfile({ selectedIssues: localIssues });
    setIsSimulating(true);
    setError(null);

    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, selectedIssues: localIssues }),
      });
      if (!res.ok) throw new Error("Failed");
      const data: ImpactResponse = await res.json();
      setSimulationData(data);
    } catch {
      setError("Failed to generate simulation. Please try again.");
    } finally {
      setIsSimulating(false);
    }
  };

  const nextActionStep = profile.votingPlan?.find(
    (s) => !profile.completedSteps.includes(s.id)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* HEADER */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
          <Sparkles className="h-4 w-4" />
          AI-Powered Civic Impact Simulator
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Discover the power of your vote
        </h1>
        <p className="text-muted-foreground text-lg">
          Gemini AI generates a personalized simulation of how civic participation shapes the future of the issues you care about.
        </p>
      </div>

      {/* ISSUE SELECTION */}
      {!simulationData && !isSimulating && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Select Your Core Issues</CardTitle>
              <CardDescription>
                Choose 2 to 3 topics you care about most. Gemini will generate a tailored impact analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_ISSUES.map((issue) => {
                  const isSelected = localIssues.includes(issue);
                  return (
                    <button key={issue} onClick={() => toggleIssue(issue)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                          : "bg-background/50 border-border hover:border-primary/50 text-foreground"
                      }`}>
                      {issue}
                    </button>
                  );
                })}
              </div>
              {localIssues.length === 0 && (
                <p className="text-sm text-amber-500 font-medium">Please select at least 2 issues to begin.</p>
              )}
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button onClick={handleGenerate} disabled={localIssues.length < 2} className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" /> Generate AI Impact Insight
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* LOADING STATE */}
      {isSimulating && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative bg-primary text-primary-foreground p-4 rounded-full">
              <Activity className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold animate-pulse">Gemini is analyzing your civic impact…</h3>
          <p className="text-muted-foreground text-sm">
            Generating personalized scenarios for {localIssues.join(" & ")}…
          </p>
        </div>
      )}

      {/* RESULTS */}
      {simulationData && !isSimulating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Personalization Header */}
          <div className="bg-secondary/50 rounded-xl p-4 sm:p-6 border border-border">
            <p className="font-medium text-foreground">
              You are a <span className="text-primary font-bold">{profile.isFirstTimeVoter ? "first-time" : "returning"}</span> voter in{" "}
              <span className="text-primary font-bold">{profile.location || "your area"}</span>.
            </p>
            <p className="text-muted-foreground mt-1">
              You care about: <span className="font-semibold text-foreground">{localIssues.join(", ")}</span>.
            </p>
          </div>

          {/* DUAL SIMULATION — AI-Generated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NON-PARTICIPATION */}
            <Card className="border-red-500/20 bg-red-500/5 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <TrendingDown className="h-6 w-6" />
                  <CardTitle className="text-xl">If You Do Not Participate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {simulationData.nonParticipationScenario.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Circle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/90">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* PARTICIPATION */}
            <Card className="border-green-500/30 bg-green-500/5 shadow-md shadow-green-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                  <TrendingUp className="h-6 w-6" />
                  <CardTitle className="text-xl">If You Participate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <ul className="space-y-3">
                  {simulationData.participationScenario.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/90">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* AI FUTURE SNAPSHOT */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
              <Sparkles className="w-64 h-64 text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Generated Future Snapshot — 4 Years Ahead
              </h3>
              <p className="text-muted-foreground text-sm mb-6 border-l-2 border-primary/40 pl-3">
                This is an AI-generated illustrative scenario. It does not predict actual outcomes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-red-500 mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Without your demographic
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {simulationData.futureSnapshot.withoutParticipation}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-500 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> With your demographic
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {simulationData.futureSnapshot.withParticipation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-card border rounded-2xl p-6 gap-6">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center h-16 w-16 rounded-full font-bold text-sm bg-primary text-primary-foreground">
                {simulationData.confidenceLevel}
              </div>
              <div>
                <h4 className="font-bold text-lg">AI Confidence</h4>
                <p className="text-xs text-muted-foreground">Generated by Gemini based on your profile and selected issues.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setSimulationData(null); }}>
              Re-generate with different issues
            </Button>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-widest">Take Action Now</p>
            {nextActionStep ? (
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm bg-secondary px-3 py-1 rounded-full">
                  Next Action: <span className="font-semibold">{nextActionStep.title}</span>
                </span>
                <Link href="/journey">
                  <Button size="lg" className="rounded-full shadow-xl shadow-primary/20 h-12 px-8 text-base">
                    Continue My Plan <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/journey">
                <Button size="lg" className="rounded-full h-12 px-8 text-base">
                  View My Voting Plan <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>

          {/* TRUST DISCLAIMER */}
          <div className="mt-12 bg-background border border-border/50 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Disclaimer:</strong> This simulation was generated by Google Gemini AI. It illustrates general civic impact based on participation trends. It does not predict actual political outcomes or election results. Please refer to official election authorities for verified information.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
