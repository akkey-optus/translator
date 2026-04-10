"use client";

import { Button } from "@/components/ui/button";

interface BottomBarProps {
  currentIndex: number;
  totalChapters: number;
  onPrev: () => void;
  onNext: () => void;
}

export function BottomBar({
  currentIndex,
  totalChapters,
  onPrev,
  onNext,
}: BottomBarProps) {
  const progress =
    totalChapters > 0
      ? Math.round(((currentIndex + 1) / totalChapters) * 100)
      : 0;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-muted/50 border-t border-border text-xs text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-6"
        onClick={onPrev}
        disabled={currentIndex <= 0}
      >
        ← Prev
      </Button>
      <span>
        {currentIndex + 1} / {totalChapters} · {progress}%
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-6"
        onClick={onNext}
        disabled={currentIndex >= totalChapters - 1}
      >
        Next →
      </Button>
    </div>
  );
}
