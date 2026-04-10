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
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="text-2xl font-bold">Dictionaries</h1>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Download a dictionary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            下载以下任一词典后，用下方的上传区载入。JMdict 支持 <code>.gz</code> 压缩包，无需手动解压。
          </p>
          <div className="space-y-3">
            {DICT_SOURCES.map((src) => (
              <div key={src.url} className="flex items-start justify-between gap-4 p-3 rounded-md border">
                <div className="min-w-0">
                  <div className="font-medium">{src.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {src.format} · {src.size} · {src.license}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Look for: <code>{src.file}</code>
                  </div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload dictionary file</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <p className="text-muted-foreground">Parsing and installing… (this can take 20-60s for JMdict)</p>
            ) : (
              <>
                <p className="text-muted-foreground mb-3">
                  Drag a dictionary file here, or click to select
                </p>
                <label className="inline-flex cursor-pointer">
                  <span className={buttonVariants({ variant: "outline" })}>Select file</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Installed dictionaries</CardTitle>
        </CardHeader>
        <CardContent>
          {dicts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No dictionaries installed yet.</p>
          ) : (
            <div className="space-y-2">
              {dicts.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div className="min-w-0">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatSourceLang(d.sourceLang)} · {d.format} · {d.entryCount.toLocaleString()} entries
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(d.id)}>
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
