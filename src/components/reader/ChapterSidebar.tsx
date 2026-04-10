"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

interface Chapter {
  id: string;
  index: number;
  title: string;
  status: string;
}

interface ChapterSidebarProps {
  chapters: Chapter[];
  currentIndex: number;
  onSelect: (index: number) => void;
  isOpen: boolean;
}

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  done: { icon: "●", color: "text-green-400" },
  translating: { icon: "◐", color: "text-yellow-400" },
  pending: { icon: "○", color: "text-muted-foreground" },
  error: { icon: "✕", color: "text-destructive" },
};

export function ChapterSidebar({
  chapters,
  currentIndex,
  onSelect,
  isOpen,
}: ChapterSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-48 border-r border-border bg-muted/30 flex-shrink-0">
      <ScrollArea className="h-full p-3">
        <div className="text-xs text-muted-foreground uppercase mb-2 font-sans">
          Table of Contents
        </div>
        {chapters.map((ch) => {
          const isCurrent = ch.index === currentIndex;
          const statusInfo = STATUS_ICONS[ch.status] || STATUS_ICONS.pending;

          return (
            <button
              key={ch.id}
              className={`block w-full text-left text-sm py-1.5 px-1 rounded transition-colors ${
                isCurrent
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSelect(ch.index)}
            >
              <span className={`${statusInfo.color} mr-1.5 text-xs`}>
                {statusInfo.icon}
              </span>
              {isCurrent && "▶ "}
              {ch.title}
            </button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
