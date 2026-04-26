"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type JourneyStep = {
  id: string;
  title: string;
  description: string;
  action: string;
  reasoning: string;
};

export default function JourneyPage() {
  const { profile, updateProfile } = useUser();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  
  const completedSteps = profile.completedSteps || [];

  const steps = profile.votingPlan || [];

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompletedSteps = completedSteps.includes(id) 
      ? completedSteps.filter(stepId => stepId !== id) 
      : [...completedSteps, id];
    updateProfile({ completedSteps: newCompletedSteps });
  };

  const toggleExpand = (id: string) => {
    setExpandedStep(expandedStep === id ? null : id);
  };

  // Find the first uncompleted step to highlight as "Next Action"
  const nextActionId = steps.find(s => !completedSteps.includes(s.id))?.id;

  const completedCount = steps.filter(s => completedSteps.includes(s.id)).length;
  const progressPercentage = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Election Journey</h1>
        <p className="text-muted-foreground">
          Follow these personalized steps to ensure your vote is counted.
        </p>
        {steps.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span>{completedCount} / {steps.length} steps completed</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {!profile.hasCompletedOnboarding && (
        <Card className="border-accent/50 bg-accent/10">
          <CardContent className="p-4 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <h3 className="font-semibold text-accent">Personalization Missing</h3>
              <p className="text-sm text-accent/80">You haven't completed your profile. These steps are generic.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = "/guide"}>
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isExpanded = expandedStep === step.id;
          const isNextAction = nextActionId === step.id;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                  isNextAction ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary" : ""
                } ${isCompleted ? "opacity-75 bg-muted/50" : ""}`}
                onClick={() => toggleExpand(step.id)}
              >
                <div className="p-4 sm:p-6 flex items-start gap-4">
                  <button 
                    onClick={(e) => toggleComplete(step.id, e)}
                    className="mt-1 flex-shrink-0 text-primary transition-transform hover:scale-110"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        {isNextAction && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1 inline-block">
                            Next Action
                          </span>
                        )}
                        <h3 className={`font-semibold text-lg ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {step.title}
                        </h3>
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{step.description}</p>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-4">
                            <div className="bg-secondary p-3 rounded-lg border border-border/50">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Required Action</h4>
                              <p className="text-sm font-medium">{step.action}</p>
                            </div>
                            
                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-xs font-semibold uppercase text-primary">Why this matters</h4>
                                {step.confidence && (
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                                    step.confidence === "High" ? "bg-green-500/10 text-green-600" :
                                    step.confidence === "Medium" ? "bg-yellow-500/10 text-yellow-600" :
                                    "bg-red-500/10 text-red-600"
                                  }`}>
                                    {step.confidence} Confidence
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground/80">{step.reasoning}</p>
                              {step.source && (
                                <p className="text-xs text-muted-foreground mt-2 italic flex items-center gap-1">
                                  <span>Source:</span> {step.source}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
