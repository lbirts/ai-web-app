"use client";

import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import {
  clearAllSessions,
  createSession,
  deleteSession,
  deriveTitle,
  getSessions,
  saveSession,
} from "@/lib/storage";
import { ChatSession, Message } from "@/lib/types";
import { useCallback, useState } from "react";

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => getSessions());
  const [activeId, setActiveId] = useState<string | undefined>();

  const activeSession = sessions.find((s) => s.id === activeId);

  const cleanupEmptySession = useCallback((sessionId?: string) => {
    if (!sessionId) return;

    setSessions((prev) => {
      const candidate = prev.find((s) => s.id === sessionId);
      if (!candidate || candidate.messages.length > 0) {
        return prev;
      }
      deleteSession(sessionId);
      return prev.filter((s) => s.id !== sessionId);
    });
  }, []);

  const handleNewSession = useCallback(() => {
    cleanupEmptySession(activeId);
    const session = createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    saveSession(session);
    return session.id;
  }, [activeId, cleanupEmptySession]);

  const handleSelectSession = useCallback(
    (id: string) => {
      if (id === activeId) return;
      cleanupEmptySession(activeId);
      setActiveId(id);
    },
    [activeId, cleanupEmptySession],
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      deleteSession(id);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (activeId === id) {
          setActiveId(next[0]?.id);
        }
        return next;
      });
    },
    [activeId],
  );

  const handleClearAll = useCallback(() => {
    clearAllSessions();
    setSessions([]);
    setActiveId(undefined);
  }, []);

  const handleMessagesChange = useCallback(
    (sessionId: string, messages: Message[]) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const updated: ChatSession = {
            ...s,
            messages,
            title: deriveTitle(messages),
            updatedAt: Date.now(),
          };
          saveSession(updated);
          return updated;
        }),
      );
    },
    [],
  );

  return (
    <main className="flex flex-row gap-4 bg-background flex-1 p-4 overflow-hidden min-h-0">
      <Sidebar
        sessions={sessions}
        onSelect={handleSelectSession}
        onNewChat={handleNewSession}
        onDelete={handleDeleteSession}
        onClearAll={handleClearAll}
      />
      <Chat
        key={activeId ?? "empty"}
        session={activeSession}
        onMessagesChange={handleMessagesChange}
        onNewSession={handleNewSession}
      />
    </main>
  );
}
