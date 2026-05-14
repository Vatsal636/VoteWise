"use client";

import { useState, useCallback } from 'react';

/**
 * Custom hook wrapping the browser's SpeechSynthesis API for text-to-speech output.
 * Provides play/stop controls and tracks the currently speaking message by ID.
 *
 * @returns Controls and state for managing speech synthesis.
 */
export function useSpeechSynthesis() {
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const speak = useCallback((text: string, id: string) => {
    if (!isSupported || !window.speechSynthesis) return;

    // Stop anything currently speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlySpeakingId(id);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentlySpeakingId(null);
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    currentlySpeakingId,
    speak,
    stop
  };
}
