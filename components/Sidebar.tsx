import { Button } from "@/components/ui/button";
import { ChatSession } from "@/lib/types";
import { Delete, Moon, PlaneTakeoffIcon, PlusIcon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import DeleteConfirmation from "./DeleteConfirmation";
import SearchDialog from "./SearchDialog";

interface Props {
  sessions: ChatSession[];
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function Sidebar({
  sessions,
  onSelect,
  onNewChat,
  onDelete,
  onClearAll,
}: Props) {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [pendingDeleteSession, setPendingDeleteSession] =
    useState<ChatSession | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isDeleteConfirmationOpen =
    showClearAllConfirm || pendingDeleteSession !== null;

  const handleDeleteConfirmationOpenChange = (open: boolean) => {
    if (!open) {
      setShowClearAllConfirm(false);
      setPendingDeleteSession(null);
    }
  };

  const handleDeleteConfirmation = () => {
    if (showClearAllConfirm) {
      onClearAll();
    } else if (pendingDeleteSession) {
      onDelete(pendingDeleteSession.id);
    }

    setShowClearAllConfirm(false);
    setPendingDeleteSession(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <aside className="w-55 gap-4 flex flex-col">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <PlaneTakeoffIcon />
          <p className="font-mono text-lg font-medium">Trip Planner</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          className="justify-start -ml-3 text-base py-4"
          onClick={onNewChat}
        >
          <PlusIcon />
          New Chat
        </Button>
        <Button
          variant="ghost"
          className="justify-start -ml-3 text-base py-4"
          onClick={() => setShowSearchDialog(true)}
        >
          <Search />
          Search
        </Button>
      </div>
      <div className="pt-4 h-full min-h-0">
        <p className="text-sm text-muted-foreground">History</p>
        <div className="flex flex-col h-full">
          {sessions.length === 0 && (
            <p className="text-center text-sm my-5">No conversations yet.</p>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div key={s.id} className="group flex items-center justify-between">
                <Button
                  onClick={() => onSelect(s.id)}
                  variant="ghost"
                  className="flex-1 justify-start"
                >
                  {s.title}
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="hidden group-hover:flex"
                  onClick={() => setPendingDeleteSession(s)}
                  aria-label={`Delete conversation: ${s.title}`}
                >
                  <Delete />
                </Button>
              </div>
            ))}
          </div>
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowClearAllConfirm(true)}
              className="mt-auto mb-4"
            >
              Clear all history
            </Button>
          )}
        </div>
      </div>
      <DeleteConfirmation
        title={
          showClearAllConfirm
            ? "all chat history"
            : (pendingDeleteSession?.title ?? "this conversation")
        }
        open={isDeleteConfirmationOpen}
        onOpenChange={handleDeleteConfirmationOpenChange}
        onConfirm={handleDeleteConfirmation}
      />
      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        sessions={sessions}
        onSelect={onSelect}
      />
    </aside>
  );
}
