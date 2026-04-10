"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Dictionary {
  id: string;
  name: string;
  format: string;
  sourceLang: string;
  entryCount: number;
  createdAt: string;
}

const DICT_SOURCES = [
  {
    name: "JMdict (Japanese → English)",
    format: "XML, gzipped",
    size: "~10 MB gz / ~30 MB xml",
    url: "https://www.edrdg.org/jmdict/edict_doc.html",
    file: "JMdict_e.gz",
    license: "CC BY-SA 4.0",
  },
  {
    name: "CC-CEDICT (Chinese → English)",
    format: "plain text (.u8)",
    size: "~8 MB",
    url: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
    file: "cedict_ts.u8",
    license: "CC BY-SA 4.0",
  },
];

function formatSourceLang(lang: string): string {
  switch (lang) {
    case "ja": return "日本語";
    case "zh": return "中文";
    case "en": return "English";
    default: return lang;
  }
}

export default function DictionaryPage() {
  const [dicts, setDicts] = useState<Dictionary[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDicts = useCallback(async () => {
    const res = await fetch("/api/dictionaries");
    if (res.ok) {
      setDicts(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchDicts();
  }, [fetchDicts]);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/dictionaries", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        await fetchDicts();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [fetchDicts],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dictionary and all its entries?")) return;
    const res = await fetch(`/api/dictionaries/${id}`, { method: "DELETE" });
    if (res.ok) fetchDicts();
  };

  return (
    <div className="min-h-screen px-6 py-10 sm:py-14 max-w-3xl mx-auto">
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
          Dictionaries
        </h1>
      </header>

      <Card className="mb-6 border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
        <CardHeader>
          <CardTitle
            className="text-base font-medium tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Download a dictionary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            下载以下任一词典后，用下方的上传区载入。JMdict 支持 <code className="text-xs bg-muted/60 px-1 py-0.5 rounded">.gz</code> 压缩包，无需手动解压。
          </p>
          <div className="space-y-3">
            {DICT_SOURCES.map((src) => (
              <div
                key={src.url}
                className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all duration-200"
              >
                <div className="min-w-0">
                  <div className="font-medium">{src.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {src.format} · {src.size} · {src.license}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Look for: <code className="bg-muted/60 px-1 py-0.5 rounded">{src.file}</code>
                  </div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Download ↗
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        <CardHeader>
          <CardTitle
            className="text-base font-medium tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Upload dictionary file
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border border-dashed rounded-xl px-6 py-10 text-center transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/40 hover:bg-accent/20"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Parsing and installing… (this can take 20-60s for JMdict)</p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-4 text-sm">
                  Drag a dictionary file here, or click to select
                </p>
                <label className="inline-flex cursor-pointer">
                  <span className={buttonVariants({ variant: "outline", size: "sm" })}>Select file</span>
                  <input
                    type="file"
                    accept=".gz,.xml,.u8,.txt"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </>
            )}
            {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
        <CardHeader>
          <CardTitle
            className="text-base font-medium tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Installed dictionaries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dicts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 italic" style={{ fontFamily: "var(--font-heading)" }}>
              No dictionaries installed yet.
            </p>
          ) : (
            <div className="space-y-2">
              {dicts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all duration-200"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatSourceLang(d.sourceLang)} · {d.format} · {d.entryCount.toLocaleString()} entries
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:border-destructive/40"
                    onClick={() => handleDelete(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
