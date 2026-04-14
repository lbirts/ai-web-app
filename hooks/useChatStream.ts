"use client";

import { Message } from "@/lib/types";
import { consumeSseChunk, flushSsePending } from "@/lib/sse";
import { useCallback, useRef, useState } from "react";

interface UseChatStreamParams {
  sessionId?: string;
  messages: Message[];
  onMessagesChange: (sessionId: string, messages: Message[]) => void;
  onNewSession: () => string;
  onSettled?: () => void;
}

export function useChatStream({
  sessionId,
  messages,
  onMessagesChange,
  onNewSession,
  onSettled,
}: UseChatStreamParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  // Keep the active request controller so the user can stop streaming.
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || loading) return;

      setError(null);
      const targetSessionId = sessionId ?? onNewSession();
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      // Optimistically append the user message before the model responds.
      const next = [...messages, userMessage];
      onMessagesChange(targetSessionId, next);
      setLoading(true);
      setStreamingContent("");
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => {});
          throw new Error(
            (body as { error?: string })?.error ?? `HTTP ${res.status}`,
          );
        }

        if (!res.body) {
          throw new Error("No stream returned from the server.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        // sseState holds parser progress across chunk boundaries.
        let sseState = { pending: "", content: "", done: false };

        while (!sseState.done) {
          const { done, value } = await reader.read();
          if (done) break;

          // Parse each chunk and incrementally stream text to the UI.
          sseState = consumeSseChunk(
            sseState,
            decoder.decode(value, { stream: true }),
          );
          setStreamingContent(sseState.content);
        }

        // Flush trailing partial event if stream ended without newline.
        sseState = flushSsePending(sseState);
        setStreamingContent(sseState.content);

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: sseState.content,
          timestamp: Date.now(),
        };
        onMessagesChange(targetSessionId, [...next, assistantMsg]);
        setStreamingContent("");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message ?? "Something went wrong.");
      } finally {
        setLoading(false);
        abortRef.current = null;
        // Let the caller handle post-request UX (e.g. focus the composer).
        onSettled?.();
      }
    },
    [loading, messages, onMessagesChange, onNewSession, onSettled, sessionId],
  );

  const stop = useCallback(() => {
    // Aborts the fetch and clears transient streaming UI state.
    abortRef.current?.abort();
    setLoading(false);
    setStreamingContent("");
  }, []);

  return {
    loading,
    error,
    setError,
    streamingContent,
    sendMessage,
    stop,
  };
}
