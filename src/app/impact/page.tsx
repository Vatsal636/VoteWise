"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, TrendingUp, TrendingDown, ArrowRight, Activity, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AVAILABLE_ISSUES = [
  "Climate & Environment",
  "Education",
  "Jobs & Economy",
  "Infrastructure",
  "Healthcare",
];

export default function ImpactSimulatorPage() {
  const { profile, updateProfile } = useUser();
  const router = useRouter();
  
  // Local state for issue selection before saving
  const [localIssues, setLocalIssues] = useState<string[]>(profile.selectedIssues || []);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(profile.selectedIssues?.length >= 2);

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
    setLocalIssues(prev => {
      if (prev.includes(issue)) return prev.filter(i => i !== issue);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, issue];
    });
  };

  const handleGenerate = () => {
    if (localIssues.length < 2 || localIssues.length > 3) return;
    
    // Save to global context
    updateProfile({ selectedIssues: localIssues });
    
    // Trigger Reveal Animation
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setShowResults(true);
    }, 2500); // 2.5s suspense
  };

  const getImpactScore = () => {
    // Simple logic for the demo score
    if (profile.isFirstTimeVoter && localIssues.length === 3) return "High";
    if (localIssues.length >= 2) return "Medium";
    return "Low";
  };

  const nextActionStep = profile.votingPlan?.find(s => !profile.completedSteps.includes(s.id));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* HEADER */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
          <Sparkles className="h-4 w-4" />
          Your Civic Impact Simulator
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Discover the power of your vote</h1>
        <p className="text-muted-foreground text-lg">
          Understand the general societal consequences of participating vs. not participating in the upcoming election.
        </p>
      </div>

      {!showResults && !isSimulating && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Select Your Core Issues</CardTitle>
              <CardDescription>
                Choose 2 to 3 topics you care about most to tailor your impact simulation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_ISSUES.map(issue => {
                  const isSelected = localIssues.includes(issue);
                  return (
                    <button
                      key={issue}
                      onClick={() => toggleIssue(issue)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                          : "bg-background/50 border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {issue}
                    </button>
                  );
                })}
              </div>

              {localIssues.length === 0 && (
                <p className="text-sm text-amber-500 font-medium">Please select at least 2 issues to begin.</p>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={localIssues.length < 2}
                className="w-full sm:w-auto"
              >
                Generate My Impact Insight
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isSimulating && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="relative bg-primary text-primary-foreground p-4 rounded-full">
              <Activity className="h-8 w-8 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold animate-pulse">Generating your impact insight...</h3>
          <p className="text-muted-foreground text-sm">Analyzing demographic trends and issue representation...</p>
        </div>
      )}

      {showResults && !isSimulating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          
          {/* PERSONALIZATION HEADER */}
          <div className="bg-secondary/50 rounded-xl p-4 sm:p-6 border border-border">
            <p className="font-medium text-foreground">
              You are a <span className="text-primary font-bold">{profile.isFirstTimeVoter ? "first-time" : "returning"}</span> voter in <span className="text-primary font-bold">{profile.location || "your area"}</span>.
            </p>
            <p className="text-muted-foreground mt-1">
              You care about: <span className="font-semibold text-foreground">{localIssues.join(", ")}</span>.
            </p>
          </div>

          {/* DUAL SIMULATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* INACTION */}
            <Card className="border-red-500/20 bg-red-500/5 shadow-none">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <TrendingDown className="h-6 w-6" />
                  <CardTitle className="text-xl">If You Do Not Participate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Circle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">Lower engagement from the {profile.ageGroup || "younger"} demographic.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">Reduced attention and funding priority for <strong>{localIssues[0]}</strong> and <strong>{localIssues[1]}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">Decisions shaping your community are influenced by a smaller, less representative voter group.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* ACTION */}
            <Card className="border-green-500/30 bg-green-500/5 shadow-md shadow-green-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mb-2">
                  <TrendingUp className="h-6 w-6" />
                  <CardTitle className="text-xl">If You Participate</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">Stronger civic representation for voters in {profile.location || "your area"}.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">Increased policy focus and community dialogue surrounding <strong>{localIssues[0]}</strong> and <strong>{localIssues[1]}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground/90">A broader, more inclusive decision-making process that reflects your values.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* FUTURE SNAPSHOT (WOW ELEMENT) */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
              <Sparkles className="w-64 h-64 text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                Illustrative Future Snapshot — 4 Years Ahead
              </h3>
              <p className="text-muted-foreground text-sm mb-6 border-l-2 border-primary/40 pl-3">
                This is an illustrative scenario to visualize societal momentum, not a prediction of factual events.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-red-500 mb-2 flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Without your demographic</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Lower visibility of {localIssues[0].toLowerCase()} initiatives. Reduced participation impact leaves major community decisions shaped by fewer voices, stalling progress on issues you care about.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-500 mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> With your demographic</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Increased public engagement leads to a stronger focus on {localIssues[0].toLowerCase()} and {localIssues[1]?.toLowerCase() || "community"} growth. Decision-making becomes more inclusive and aligned with younger voters.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* IMPACT SCORE & EMOTIONAL HOOK */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-card border rounded-2xl p-6 gap-6">
            <div className="flex items-center gap-4">
              <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-full font-bold text-lg ${
                getImpactScore() === "High" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}>
                {getImpactScore()}
              </div>
              <div>
                <h4 className="font-bold text-lg">Civic Impact Potential</h4>
                <p className="text-xs text-muted-foreground">Based on your profile, first-time voter status, and selected issues.</p>
              </div>
            </div>
            
            <div className="text-center sm:text-right max-w-sm">
              <p className="text-sm font-medium italic text-foreground/80">
                "Your participation influences which direction becomes more likely."
              </p>
            </div>
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
              <strong>Disclaimer:</strong> This simulation illustrates general civic impact based on participation trends. It does not predict actual political outcomes or election results. Please refer to official election authorities for verified information.
            </p>
          </div>

        </motion.div>
      )}
    </div>
  );
}
