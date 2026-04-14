"use client";

import { Button } from "@/components/ui/button";
import { SendIcon, StopCircle } from "lucide-react";
import { ChangeEvent, KeyboardEvent } from "react";

interface Props {
  value: string;
  isLoading: boolean;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmitOrStop: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ChatComposer({
  value,
  isLoading,
  onChange,
  onKeyDown,
  onSubmitOrStop,
  textareaRef,
}: Props) {
  return (
    <div className="w-3xl h-35 border-border border rounded-md shadow-lg flex flex-col p-3">
      <textarea
        ref={textareaRef}
        value={value}
        className="w-full outline-0 resize-none h-full"
        placeholder="How can I help you plan your next trip?"
        onKeyDown={onKeyDown}
        onChange={onChange}
        disabled={isLoading}
      />
      <Button
        size="icon-sm"
        variant="ghost"
        className="mt-auto ml-auto"
        onClick={onSubmitOrStop}
      >
        {isLoading ? <StopCircle /> : <SendIcon />}
      </Button>
    </div>
  );
}
