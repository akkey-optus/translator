"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export type ViewMode = "single" | "dual" | "triple";

interface TopBarProps {
  bookTitle: string;
  chapterTitle: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  bookTitle,
  chapterTitle,
  viewMode,
  onViewModeChange,
  onToggleSidebar,
  onOpenSettings,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border text-sm">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="text-lg cursor-pointer" aria-label="Toggle table of contents">
          ☰
        </button>
        <Link href="/" className="text-muted-foreground hover:text-foreground text-xs" aria-label="Back to library">
          ←
        </Link>
        <span className="font-semibold">{bookTitle}</span>
        <span className="text-muted-foreground">— {chapterTitle}</span>
      </div>
      <div className="flex gap-1.5">
        {(["single", "dual", "triple"] as const).map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={viewMode === mode ? "default" : "outline"}
            className="text-xs h-7 px-2"
            onClick={() => onViewModeChange(mode)}
          >
            {mode === "single" ? "単語" : mode === "dual" ? "二語" : "三語"}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={onOpenSettings}>
          Aa
        </Button>
      </div>
    </div>
  );
}
