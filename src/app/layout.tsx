import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/global/DisclaimerBanner";
import { NextActionBar } from "@/components/global/NextActionBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoteWise AI",
  description: "Your personal, AI-powered election assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <UserProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-semibold">
            Skip to main content
          </a>
          <DisclaimerBanner />
          <Navbar />
          <main id="main-content" role="main" aria-label="Main content" className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-8 py-8">
            {children}
          </main>
          <Footer />
          <NextActionBar />
        </UserProvider>
      </body>
    </html>
  );
}
