"use client";

import { useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine, Upload, Loader2, FileCheck2, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Camera,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ScannerResponse, ElectionStep } from "@/lib/gemini";

export default function ScannerPage() {
  const { profile, updateProfile } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScannerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Please upload an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      // Extract base64 and mime type from data URL
      const match = preview.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) throw new Error("Invalid image format");

      const mimeType = match[1];
      const imageBase64 = match[2];

      const res = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType, profile }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Analysis failed");
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Analysis failed");
      setResult(json.data as ScannerResponse);
    } catch {
      setError("Failed to analyze document. Please try again with a clearer image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSteps = () => {
    if (!result?.nextSteps) return;
    const existingIds = new Set(profile.votingPlan?.map((s) => s.id) || []);
    const newSteps = result.nextSteps.filter((s) => !existingIds.has(s.id));
    if (newSteps.length > 0) {
      updateProfile({ votingPlan: [...(profile.votingPlan || []), ...newSteps] });
    }
  };

  const resetScanner = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
          <ScanLine className="h-4 w-4" />
          Gemini Vision — Multimodal AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Document Scanner</h1>
        <p className="text-muted-foreground text-lg">
          Upload a photo of your voter ID, registration form, or election notice. Gemini will analyze it instantly.
        </p>
      </div>

      {/* Upload Area */}
      {!result && (
        <Card className="glass border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleFileSelect} className="hidden" id="doc-upload" />

            {!preview ? (
              <label htmlFor="doc-upload"
                className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Upload or Capture Document</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Voter ID, Registration Form, Election Notice, Address Proof
                </p>
                <Button type="button" variant="outline" className="rounded-full">
                  <Upload className="h-4 w-4 mr-2" /> Choose File
                </Button>
              </label>
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden border border-border max-h-[400px]">
                  <Image src={preview} alt="Document preview"
                    width={800} height={400} unoptimized
                    className="w-full h-full object-contain max-h-[400px]" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="relative bg-primary text-primary-foreground p-3 rounded-full">
                          <ScanLine className="h-6 w-6 animate-pulse" />
                        </div>
                      </div>
                      <p className="mt-4 font-semibold animate-pulse">Gemini is analyzing your document…</p>
                      <p className="text-sm text-muted-foreground mt-1">Extracting information and generating next steps</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1">
                    {isAnalyzing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</>
                    ) : (
                      <><ScanLine className="h-4 w-4 mr-2" /> Analyze with Gemini Vision</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetScanner} disabled={isAnalyzing}>
                    Change Image
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary Card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground p-2 rounded-full">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{result.documentType}</CardTitle>
                    <CardDescription>{result.summary}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Extracted Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extracted Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(result.extractedInfo).map(([key, value]) => (
                    <div key={key} className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{key}</p>
                      <p className="text-sm font-medium mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Fields */}
            {result.missingFields.length > 0 && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" /> Missing or Unclear Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.missingFields.map((field, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {result.nextSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Recommended Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.nextSteps.map((step, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {i + 1}
                        </span>
                        <h4 className="font-semibold text-sm">{step.title}</h4>
                      </div>
                      <p className="text-sm text-foreground/80 ml-7">{step.action}</p>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button onClick={handleAddSteps} className="flex-1">
                      <ArrowRight className="h-4 w-4 mr-2" /> Add Steps to My Voting Plan
                    </Button>
                    <Button variant="outline" onClick={resetScanner}>
                      Scan Another Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Disclaimer */}
            <div className="bg-background border border-border/50 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Disclaimer:</strong> This analysis was generated by Google Gemini Vision AI. Always verify extracted information with official documents. VoteWise does not store or transmit your document images.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
