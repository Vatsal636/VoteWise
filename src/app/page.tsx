"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, CheckCircle2, Bot, Map } from "lucide-react";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const { profile } = useUser();
  const targetHref = profile.hasCompletedOnboarding ? "/journey" : "/guide";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-3xl"
      >
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          Your Personal Election Coach
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Vote with Confidence.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Step-by-step guidance tailored to your situation. Stop guessing and let AI navigate the voting process for you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href={targetHref}>
            <Button size="lg" className="w-full sm:w-auto text-base rounded-full shadow-lg">
              {profile.hasCompletedOnboarding ? "Continue Journey" : "Start Your Journey"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/assistant">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base rounded-full glass">
              Ask Assistant
              <Bot className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-12"
      >
        {[
          {
            title: "Personalized Steps",
            description: "We adapt to your age, location, and voting history.",
            icon: Map,
          },
          {
            title: "Explainable AI",
            description: "Understand exactly *why* you need to take each step.",
            icon: Bot,
          },
          {
            title: "Action-Oriented",
            description: "No long paragraphs. Just clear, actionable tasks.",
            icon: CheckCircle2,
          },
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center space-y-3 p-6 rounded-2xl glass">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
