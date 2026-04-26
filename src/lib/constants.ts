import { ElectionStep } from "./gemini";

export const getInitialVotingPlan = (isFirstTimeVoter: boolean | null, location: string): ElectionStep[] => {
  const baseSteps: ElectionStep[] = [
    {
      id: "eligibility",
      title: "Check Eligibility",
      action: "Review age and citizenship requirements.",
      reasoning: "You must be 18 and a citizen. This is the foundational rule for voting.",
      confidence: "High",
      source: "General Election Rules"
    },
    {
      id: "registration",
      title: "Register to Vote",
      action: `Visit the ${location || "state"} election portal to register online.`,
      reasoning: "You cannot vote if you are not registered. This is mandatory.",
      confidence: "High",
      source: "Voter Registration Guidelines"
    },
    {
      id: "voter-id",
      title: "Obtain Valid Voter ID",
      action: "Check accepted ID forms (e.g., Driver's License, Passport).",
      reasoning: "Many states require photo ID to verify your identity before handing you a ballot.",
      confidence: "High",
      source: "Voter ID Laws"
    },
    {
      id: "polling-booth",
      title: "Locate Polling Booth",
      action: "Use the polling place locator tool.",
      reasoning: "You must vote at your assigned location; going elsewhere may invalidate your vote.",
      confidence: "High",
      source: "Polling Location Directory"
    },
    {
      id: "vote",
      title: "Cast Your Vote",
      action: "Bring your ID and vote!",
      reasoning: "This is the final step in exercising your democratic right.",
      confidence: "High",
    }
  ];

  if (isFirstTimeVoter) {
    return baseSteps;
  }
  
  // Skip basic steps for returning voters
  return baseSteps.filter(s => s.id !== "eligibility" && s.id !== "registration");
};
