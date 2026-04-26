"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { getInitialVotingPlan } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { User, MapPin, Sparkles, Target, ArrowRight, CheckCircle2, Clock, Bot, Map, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function GuidePage() {
  const { profile, updateProfile } = useUser();
  const router = useRouter();
  
  // Dashboard vs Wizard State
  const [isEditing, setIsEditing] = useState(!profile.hasCompletedOnboarding);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageGroup: profile.ageGroup || "",
    isFirstTimeVoter: profile.isFirstTimeVoter,
    location: profile.location || "",
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // If they are just editing, don't overwrite their entire plan unless necessary, 
      // but for simplicity of this demo, we can just regenerate base plan or keep existing.
      // We will generate a fresh plan if they change status/location.
      const initialPlan = getInitialVotingPlan(formData.isFirstTimeVoter, formData.location);
      updateProfile({ 
        ...formData, 
        hasCompletedOnboarding: true,
        votingPlan: initialPlan
      });
      setIsEditing(false); // Return to dashboard
    }
  };

  // Dashboard calculations
  const steps = profile.votingPlan || [];
  const completedSteps = profile.completedSteps || [];
  const completedCount = steps.filter(s => completedSteps.includes(s.id)).length;
  const progressPercentage = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const nextActionStep = steps.find(s => !completedSteps.includes(s.id));
  const upcomingSteps = steps.filter(s => !completedSteps.includes(s.id)).slice(1, 3);
  
  const getImpactScore = () => {
    if (!profile.selectedIssues) return "Pending";
    if (profile.isFirstTimeVoter && profile.selectedIssues.length === 3) return "High";
    if (profile.selectedIssues.length >= 2) return "Medium";
    return "Low";
  };

  if (isEditing) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] pb-24">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-primary/20 shadow-xl shadow-primary/5 glass">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Step {step} of 3</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1.5 w-6 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
              <CardTitle>
                {step === 1 && "What's your age group?"}
                {step === 2 && "Are you a first-time voter?"}
                {step === 3 && "Where will you be voting?"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "This helps us tailor deadlines and requirements."}
                {step === 2 && "We'll prioritize registration if you are."}
                {step === 3 && "Rules vary by state and county."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {["18-24", "25-34", "35-50", "51+"].map((age) => (
                    <Button
                      key={age}
                      variant={formData.ageGroup === age ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setFormData({ ...formData, ageGroup: age })}
                    >
                      {age}
                    </Button>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={formData.isFirstTimeVoter === true ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, isFirstTimeVoter: true })}
                  >
                    Yes, first time
                  </Button>
                  <Button
                    variant={formData.isFirstTimeVoter === false ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, isFirstTimeVoter: false })}
                  >
                    No, voted before
                  </Button>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <Input
                    placeholder="e.g. California, Texas, New York..."
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && formData.location) handleNext();
                    }}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
              ) : profile.hasCompletedOnboarding ? (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              ) : <div />}
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !formData.ageGroup) ||
                  (step === 2 && formData.isFirstTimeVoter === null) ||
                  (step === 3 && !formData.location)
                }
              >
                {step === 3 ? "Save Profile" : "Continue"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Civic Dashboard</h1>
        <p className="text-muted-foreground">Your central hub for voting progress and impact.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        
        {/* 1) Civic Profile Card */}
        <Card className="glass border-primary/30 shadow-lg shadow-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {profile.isFirstTimeVoter ? "First-Time Voter" : "Returning Voter"}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </span>
              </div>
              <h2 className="text-2xl font-bold">You are a {profile.isFirstTimeVoter ? "first-time" : "returning"} voter in {profile.location}.</h2>
              {profile.selectedIssues && profile.selectedIssues.length > 0 && (
                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> Focus Areas: <span className="font-medium text-foreground">{profile.selectedIssues.join(", ")}</span>
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-center justify-center bg-background/50 backdrop-blur border border-border/50 rounded-2xl p-4 min-w-[140px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Impact Potential</span>
              <div className={`text-2xl font-black ${
                getImpactScore() === "High" ? "text-primary" : 
                getImpactScore() === "Medium" ? "text-yellow-500" : 
                "text-muted-foreground"
              }`}>
                {getImpactScore()}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 2) Voting Plan Snapshot (Takes up 2 columns) */}
          <Card className="md:col-span-2 glass border-border/50 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Map className="h-5 w-5 text-primary" /> Voting Plan Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>Progress</span>
                  <span className="text-primary">{completedCount} / {steps.length} Steps Completed</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {nextActionStep ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary mb-1 block">Current Next Action</span>
                    <p className="font-semibold">{nextActionStep.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{nextActionStep.action}</p>
                  </div>
                  <Link href="/journey">
                    <Button size="sm" className="shrink-0 whitespace-nowrap">Continue Plan <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </Link>
                </div>
              ) : steps.length > 0 ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-500">You are ready to vote!</p>
                    <p className="text-xs text-muted-foreground">All steps completed. Fantastic job.</p>
                  </div>
                </div>
              ) : null}

              {upcomingSteps.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Upcoming Steps</span>
                  <ul className="space-y-2">
                    {upcomingSteps.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground/80 opacity-70">
                        <Clock className="h-4 w-4" /> {s.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3) Impact Summary Block */}
          <Card className="glass border-border/50 flex flex-col bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Civic Impact</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
              {profile.selectedIssues && profile.selectedIssues.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Your participation directly strengthens community voices regarding <span className="font-semibold">{profile.selectedIssues[0]}</span> and ensures future policies align with your demographic's values.
                  </p>
                  <Link href="/impact" className="block mt-auto">
                    <Button variant="secondary" className="w-full text-primary bg-primary/10 hover:bg-primary/20 border-0">
                      View Full Impact <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col h-full justify-center text-center">
                  <p className="text-sm text-muted-foreground">
                    Discover how your vote shapes the future of your community.
                  </p>
                  <Link href="/impact">
                    <Button variant="outline" className="w-full">Simulate Impact</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* 4) Quick Actions Panel */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/assistant">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 glass hover:border-primary/50 transition-colors">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-xs">Update My Plan</span>
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 glass hover:border-primary/50 transition-colors">
                <Bot className="h-5 w-5 text-primary" />
                <span className="text-xs">Ask Assistant</span>
              </Button>
            </Link>
            <Link href="/timeline">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 glass hover:border-primary/50 transition-colors">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-xs">View Timeline</span>
              </Button>
            </Link>
            <Link href="/impact">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 glass hover:border-primary/50 transition-colors">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-xs">View Impact</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 5) Personalization Details (Editable) */}
        <Card className="glass border-border/50">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-semibold">Personal Details</h4>
                <p className="text-xs text-muted-foreground">
                  Age: {profile.ageGroup} • {profile.isFirstTimeVoter ? "First-Time" : "Returning"} • {profile.location}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </CardContent>
        </Card>

        {/* 6) Reminder / Guidance Block */}
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            Your voting journey is in progress. Complete all steps to ensure you are fully prepared and registered before election day.
          </p>
        </div>

      </motion.div>
    </div>
  );
}
