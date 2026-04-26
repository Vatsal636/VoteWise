"use client";

import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/Button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function NextActionBar() {
  const { profile } = useUser();
  const steps = profile.votingPlan || [];
  const completedSteps = profile.completedSteps || [];
  
  if (!profile.hasCompletedOnboarding || steps.length === 0) return null;

  const nextStep = steps.find(s => !completedSteps.includes(s.id));

  return (
    <AnimatePresence>
      {nextStep && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none"
        >
          <div className="max-w-screen-2xl mx-auto flex justify-center">
            <div className="bg-primary text-primary-foreground shadow-xl rounded-full px-6 py-3 flex items-center gap-4 pointer-events-auto border border-primary-foreground/20 backdrop-blur-md">
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">Next Action</span>
                <span className="font-semibold text-sm line-clamp-1 max-w-[200px]">{nextStep.title}</span>
              </div>
              <div className="sm:hidden font-semibold text-sm line-clamp-1 max-w-[150px]">
                {nextStep.title}
              </div>
              
              <Link href="/journey">
                <Button variant="secondary" size="sm" className="rounded-full font-bold h-8">
                  Go to Step <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
