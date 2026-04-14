import { Message } from "@/lib/types";
import { Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const [copied, setCopied] = useState(false);

  const formatDate = () => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "2-digit",
    });
    return formatter.format(message.timestamp);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="group relative space-y-1 w-fit place-self-end">
      <div className="p-2 bg-background max-w-lg min-w-40 rounded-lg">
        {message.content}
      </div>
      <div className="gap-2 items-center group-hover:opacity-100 flex opacity-0  transition-opacity justify-end">
        {copied && <p className="text-xs text-muted-foreground">Copied!</p>}
        <p className="text-sm">{formatDate()}</p>
        <Button
          onClick={handleCopy}
          size="icon-sm"
          variant="ghost"
          aria-label="Copy message content"
        >
          <Copy />
        </Button>
      </div>
    </div>
  );
}
