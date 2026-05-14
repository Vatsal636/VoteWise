"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Browser-native SpeechRecognition interface extension.
 * Required because TypeScript's DOM typings do not include the Web Speech API.
 */
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

/**
 * Custom hook that wraps the browser's Web Speech API for speech-to-text input.
 * Uses `webkitSpeechRecognition` for cross-browser support (primarily Chrome).
 *
 * @param onResult - Callback invoked with the final transcript string when speech is recognized.
 * @returns Controls and state for managing speech recognition.
 */
export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  });
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;
    if (typeof window === 'undefined') return null;

    const SpeechRecognitionCtor = (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return null;

    const recognition = new (SpeechRecognitionCtor as any)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onResultRef.current(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone permission denied.");
      } else if (event.error === 'network') {
        setError("Network error occurred.");
      } else if (event.error === 'no-speech') {
        setError("No speech detected. Try again.");
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (!isSupported) {
      setError("Voice not supported in this browser.");
      return;
    }
    const recognition = ensureRecognition();
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        // Handle case where it's already started
        console.warn("Recognition already started", err);
      }
    }
  }, [isSupported, ensureRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    clearError: () => setError(null)
  };
}
