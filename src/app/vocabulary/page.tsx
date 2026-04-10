"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VocabularyEditDialog,
  type VocabularyEntry,
} from "@/components/vocabulary/VocabularyEditDialog";

const LANG_OPTIONS = [
  { value: "all", label: "All languages" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

function formatLang(lang: string): string {
  if (lang === "ja") return "JA";
  if (lang === "zh") return "ZH";
  if (lang === "en") return "EN";
  return lang.toUpperCase();
}

export default function VocabularyPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [langFilter, setLangFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<VocabularyEntry | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vocabulary");
      if (res.ok) {
        setEntries(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filtered = useMemo(() => {
    let list = entries;
    if (langFilter !== "all") {
      list = list.filter((e) => e.lang === langFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.word.toLowerCase().includes(q) ||
          e.gloss.toLowerCase().includes(q) ||
          (e.reading ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [entries, langFilter, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vocabulary entry?")) return;
    const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
    if (res.ok) fetchEntries();
  };

  return (
    <div className="min-h-screen px-6 py-10 sm:py-14 max-w-4xl mx-auto">
      <header className="mb-10 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Link
          href="/"
          className="h-10 w-10 flex items-center justify-center rounded-full border border-border/60 text-foreground hover:bg-accent/60 hover:border-primary/40 hover:-translate-x-0.5 transition-all duration-200"
          aria-label="Back to library"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <h1
          className="text-3xl font-medium tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Vocabulary
        </h1>
      </header>

      <Card className="mb-5 border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-48">
            <Select
              value={langFilter}
              onValueChange={(v) => { if (v !== null) setLangFilter(v); }}
            >
              <SelectTrigger aria-label="Filter by language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANG_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Search word, reading, or gloss…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
        <CardHeader>
          <CardTitle
            className="text-base font-medium tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8 italic" style={{ fontFamily: "var(--font-heading)" }}>
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 italic" style={{ fontFamily: "var(--font-heading)" }}>
              {entries.length === 0
                ? "No vocabulary yet. Select a word in the reader to save it."
                : "No entries match your filter."}
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((e, i) => (
                <div
                  key={e.id}
                  className="py-4 flex items-start gap-4 stagger-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="text-xl font-medium tracking-tight"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {e.word}
                      </span>
                      {e.reading && (
                        <span className="text-sm text-muted-foreground italic">{e.reading}</span>
                      )}
                      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5 font-medium">
                        {formatLang(e.lang)}
                      </span>
                    </div>
                    <div className="text-sm text-foreground/80 mt-1.5 break-words leading-relaxed">
                      {e.gloss}
                    </div>
                    {e.note && (
                      <div className="text-xs text-muted-foreground mt-1.5 italic">
                        Note: {e.note}
                      </div>
                    )}
                    {e.sourceContext && (
                      <div className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2 italic">
                        &ldquo;{e.sourceContext}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-muted-foreground hover:text-destructive hover:border-destructive/40"
                      onClick={() => handleDelete(e.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VocabularyEditDialog
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={fetchEntries}
      />
    </div>
  );
}
