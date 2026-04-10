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
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="text-2xl font-bold">Vocabulary</h1>
      </header>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {entries.length === 0
                ? "No vocabulary yet. Select a word in the reader to save it."
                : "No entries match your filter."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((e) => (
                <div key={e.id} className="py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-lg font-medium">{e.word}</span>
                      {e.reading && (
                        <span className="text-sm text-muted-foreground">{e.reading}</span>
                      )}
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1">
                        {formatLang(e.lang)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 break-words">{e.gloss}</div>
                    {e.note && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        Note: {e.note}
                      </div>
                    )}
                    {e.sourceContext && (
                      <div className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                        “{e.sourceContext}”
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(e.id)}>
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
