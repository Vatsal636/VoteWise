"use client";

import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface VoiceAssistantControlsProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceAssistantControls({ onTranscript, disabled }: VoiceAssistantControlsProps) {
  const { isListening, isSupported, error, startListening, stopListening, clearError } = useSpeechRecognition(onTranscript);

  if (!isSupported) {
    return (
      <Button 
        type="button" 
        size="icon" 
        variant="ghost" 
        className="rounded-full flex-shrink-0 opacity-50"
        title="Voice not supported in this browser"
        disabled
        aria-label="Voice input not supported"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {error && (
        <div className="absolute bottom-full mb-2 whitespace-nowrap bg-destructive text-destructive-foreground text-[10px] font-semibold px-2 py-1 rounded shadow-lg flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
          <button onClick={clearError} className="ml-1 opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      {isListening && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-30 animate-ping"></span>
      )}
      
      <Button 
        type="button" 
        size="icon" 
        variant={isListening ? "default" : "outline"}
        onClick={handleToggle}
        disabled={disabled}
        className={`rounded-full flex-shrink-0 h-10 w-10 relative z-10 transition-colors ${
          isListening ? "bg-primary text-primary-foreground border-primary" : "glass border-primary/20"
        }`}
        title={isListening ? "Listening... Click to stop" : "Tap to speak"}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
        aria-pressed={isListening}
      >
        <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
      </Button>
    </div>
  );
}
