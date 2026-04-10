"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface WordSelection {
  word: string;
  lang: string;
  rect: DOMRect;
  contextText: string;
}

interface LookupResult {
  dictionaryId: string;
  dictionaryName: string;
  headword: string;
  reading: string;
  gloss: string;
}

interface WordLookupPopoverProps {
  selection: WordSelection;
  bookId: string;
  onClose: () => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function WordLookupPopover({ selection, bookId, onClose }: WordLookupPopoverProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<LookupResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<Record<number, SaveState>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch dictionary entries
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch("/api/dict/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: selection.lang, query: selection.word }),
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Lookup failed");
        return r.json();
      })
      .then((data: { results: LookupResult[] }) => {
        setResults(data.results);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [selection.lang, selection.word]);

  // Close on outside click or ESC
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Defer the mousedown listener by one tick so the selection event that
    // opened us doesn't also close us.
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleMouseDown);
    }, 0);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSave = useCallback(
    async (index: number, result: LookupResult) => {
      setSaveState((s) => ({ ...s, [index]: "saving" }));
      try {
        const res = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: selection.word,
            lang: selection.lang,
            reading: result.reading || null,
            gloss: result.gloss,
            sourceBookId: bookId,
            sourceContext: selection.contextText || null,
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveState((s) => ({ ...s, [index]: "saved" }));
      } catch {
        setSaveState((s) => ({ ...s, [index]: "error" }));
      }
    },
    [selection, bookId],
  );

  // Position: place popover below the selection, clamp to viewport.
  const POPOVER_WIDTH = 360;
  const left = Math.max(
    8,
    Math.min(selection.rect.left, window.innerWidth - POPOVER_WIDTH - 8),
  );
  const top = selection.rect.bottom + 8;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-3 text-sm"
      style={{ top, left, width: POPOVER_WIDTH, maxHeight: "50vh", overflowY: "auto" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="font-semibold mb-2 pb-2 border-b border-border flex items-center justify-between">
        <span>{selection.word}</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {loading && <p className="text-muted-foreground">Looking up…</p>}
      {error && <p className="text-destructive">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="text-muted-foreground">
          No entries found. Try a shorter word, or install a dictionary on the
          {" "}
          <a href="/dictionary" className="underline">Dictionaries</a> page.
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r, i) => (
            <li key={`${r.dictionaryId}-${i}`} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{r.headword}</span>
                {r.reading && (
                  <span className="text-xs text-muted-foreground">{r.reading}</span>
                )}
              </div>
              <div className="text-muted-foreground">{r.gloss}</div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {r.dictionaryName}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saveState[i] === "saving" || saveState[i] === "saved"}
                  onClick={() => handleSave(i, r)}
                >
                  {saveState[i] === "saving"
                    ? "Saving…"
                    : saveState[i] === "saved"
                      ? "Saved ✓"
                      : saveState[i] === "error"
                        ? "Retry"
                        : "+ Save"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
