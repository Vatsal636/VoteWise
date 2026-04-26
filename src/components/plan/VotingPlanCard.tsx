"use client";

import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2, Circle } from "lucide-react";

export function VotingPlanCard() {
  const { profile } = useUser();
  const steps = profile.votingPlan || [];
  const completedSteps = profile.completedSteps || [];

  if (steps.length === 0) return null;

  const nextActionId = steps.find(s => !completedSteps.includes(s.id))?.id;

  return (
    <Card className="border-primary/20 bg-background/50 backdrop-blur-md shadow-lg shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          Your Voting Plan
          <span className="text-xs font-normal text-muted-foreground ml-auto bg-secondary px-2 py-1 rounded-md">
            {profile.location ? `Tailored for ${profile.location}` : "Personalized"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isNextAction = nextActionId === step.id;

            return (
              <li key={step.id} className={`flex gap-3 ${isCompleted ? 'opacity-60' : ''}`}>
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className={`h-5 w-5 ${isNextAction ? 'text-primary fill-primary/10' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      Step {index + 1}: {step.title}
                    </span>
                    {isNextAction && (
                      <span className="text-[9px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                        Next Action
                      </span>
                    )}
                  </div>
                  {!isCompleted && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {step.reasoning}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
