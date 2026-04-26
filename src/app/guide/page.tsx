"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { getInitialVotingPlan } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

export default function GuidePage() {
  const { profile, updateProfile } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ageGroup: profile.ageGroup || "",
    isFirstTimeVoter: profile.isFirstTimeVoter,
    location: profile.location || "",
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      const initialPlan = getInitialVotingPlan(formData.isFirstTimeVoter, formData.location);
      updateProfile({ 
        ...formData, 
        hasCompletedOnboarding: true,
        votingPlan: initialPlan
      });
      router.push("/journey");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 shadow-xl shadow-primary/5">
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
            ) : <div />}
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.ageGroup) ||
                (step === 2 && formData.isFirstTimeVoter === null) ||
                (step === 3 && !formData.location)
              }
            >
              {step === 3 ? "Complete Profile" : "Continue"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
