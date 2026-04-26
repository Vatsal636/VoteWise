"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { ElectionStep } from "@/lib/gemini";

type UserProfile = {
  ageGroup: string;
  isFirstTimeVoter: boolean | null;
  location: string;
  hasCompletedOnboarding: boolean;
  completedSteps: string[];
  votingPlan: ElectionStep[];
  selectedIssues: string[];
};

type UserContextType = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetProfile: () => void;
};

const defaultProfile: UserProfile = {
  ageGroup: "",
  isFirstTimeVoter: null,
  location: "",
  hasCompletedOnboarding: false,
  completedSteps: [],
  votingPlan: [],
  selectedIssues: [],
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("votewise-profile");
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse user profile from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("votewise-profile", JSON.stringify(profile));
    }
  }, [profile, isLoaded]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
