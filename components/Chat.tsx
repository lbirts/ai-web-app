"use client";

import { Button } from "@/components/ui/button";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatSession, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PlaneTakeoff, X } from "lucide-react";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import ChatComposer from "./ChatComposer";
import MessageBubble from "./MessageBubble";

interface Props {
  session?: ChatSession;
  onMessagesChange: (sessionId: string, messages: Message[]) => void;
  onNewSession: () => string;
}

export default function Chat({
  session,
  onMessagesChange,
  onNewSession,
}: Props) {
  const [prompt, setPrompt] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep a stable array reference for hook dependencies.
  const messages = useMemo(() => session?.messages ?? [], [session?.messages]);
  const { loading, error, setError, streamingContent, sendMessage, stop } =
    useChatStream({
      sessionId: session?.id,
      messages,
      onMessagesChange,
      onNewSession,
      onSettled: () => {
        setTimeout(() => textareaRef.current?.focus(), 50);
      },
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const submitPrompt = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setPrompt("");
    await sendMessage(trimmed);
  }, [prompt, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmitOrStop = () => {
    if (loading) {
      stop();
    } else {
      submitPrompt();
    }
  };

  const isEmpty = !session && !streamingContent;

  return (
    <div className="bg-card rounded-lg p-4 flex-1 min-h-0 flex flex-col">
      <div
        className={cn(
          "mx-auto w-full max-w-3xl flex-1 min-h-0 flex flex-col",
          session ? "space-y-4" : "space-y-8",
        )}
      >
        {isEmpty && (
          <div className="flex gap-3 items-center justify-center">
            <PlaneTakeoff className="size-8" />
            <h2 className="text-3xl">Get ready to take off!</h2>
          </div>
        )}
        {/* Messages content */}
        <div className="space-y-2 overflow-y-auto min-h-0 flex-1 pr-1">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <MessageBubble key={msg.id} message={msg} />
            ) : (
              <div key={msg.id} className="space-y-1">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ),
          )}
          {streamingContent && (
            <div className="space-y-1">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {loading && !streamingContent && <p className="italic">Pondering...</p>}
        {error && (
          <div className="bg-red-50 p-4 border-red-500 border rounded-md max-w-3xl relative text-sm">
            <span>{error}</span>
            <Button
              onClick={() => setError(null)}
              variant="ghost"
              size="icon-sm"
              className="absolute right-2 top-2"
            >
              <X />
            </Button>
          </div>
        )}
        <ChatComposer
          value={prompt}
          isLoading={loading}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onSubmitOrStop={handleSubmitOrStop}
          textareaRef={textareaRef}
        />
        <p className="font-mono text-xs text-right">
          Responses powered by GPT-4o mini via OpenAI.
        </p>
      </div>
    </div>
  );
}
