/**
 * @file UI render test for VoteWise AI Navbar component.
 * @description Ensures the navigation renders all expected links and landmark elements.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link to render as a plain anchor
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement("a", { href }, children);
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Vote: () => React.createElement("svg", { "data-testid": "icon-vote" }),
  Bot: () => React.createElement("svg", { "data-testid": "icon-bot" }),
  Map: () => React.createElement("svg", { "data-testid": "icon-map" }),
  User: () => React.createElement("svg", { "data-testid": "icon-user" }),
  Sparkles: () => React.createElement("svg", { "data-testid": "icon-sparkles" }),
  ScanLine: () => React.createElement("svg", { "data-testid": "icon-scanline" }),
}));

// Mock the cn utility
jest.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

// Import component after mocks
import { Navbar } from "@/components/layout/Navbar";

describe("Navbar", () => {
  it("renders the VoteWise AI brand name", () => {
    render(React.createElement(Navbar));
    expect(screen.getByText("VoteWise AI")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(React.createElement(Navbar));
    expect(screen.getByText("Journey")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.getByText("Impact")).toBeInTheDocument();
    expect(screen.getByText("Scanner")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders a nav landmark element", () => {
    render(React.createElement(Navbar));
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });
});
