import { ChatSession } from "@/lib/types";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Separator } from "./ui/separator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: ChatSession[];
  onSelect: (id: string) => void;
}
export default function SearchDialog({
  open,
  onOpenChange,
  sessions,
  onSelect,
}: Props) {
  const [search, setSearch] = useState<string>("");
  const normalizedQuery = search.trim().toLowerCase();

  const filteredSessions = useMemo(() => {
    if (!normalizedQuery) return [];

    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(normalizedQuery) ||
        s.messages.some((msg) =>
          msg.content.toLowerCase().includes(normalizedQuery),
        ),
    );
  }, [sessions, normalizedQuery]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
    setSearch("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 max-w-lg! gap-0 rounded-md"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle className="sr-only">Search Conversations</DialogTitle>
          <DialogDescription className="sr-only">
            Search through your conversation history.
          </DialogDescription>
        </DialogHeader>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="outline-0 h-12 text-lg px-3"
          placeholder="Search..."
          autoFocus
        />
        <Separator className="mb-2" />
        {!normalizedQuery && (
          <div className="flex flex-col justify-between items-center my-10">
            Please search to filter results
          </div>
        )}
        {!filteredSessions.length && normalizedQuery && (
          <div className="flex flex-col justify-between items-center my-10">
            Couldn&apos;t find any conversations, please try to refine your
            search.
          </div>
        )}
        {filteredSessions.length > 0 && (
          <div className="max-h-80 overflow-y-auto px-2 pb-2">
            {filteredSessions.map((s) => (
              <Button
                variant="ghost"
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="w-full justify-start"
              >
                {s.title}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
