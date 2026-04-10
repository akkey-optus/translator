"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    sourceLang: string;
    totalChapters: number;
    translatedChapters: number;
    status: string;
  };
  onDelete: (id: string) => void;
}

const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  zh: "中文",
  en: "English",
};

export function BookCard({ book, onDelete }: BookCardProps) {
  const progress =
    book.totalChapters > 0
      ? Math.round((book.translatedChapters / book.totalChapters) * 100)
      : 0;

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 ease-out group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium text-lg tracking-tight truncate group-hover:text-primary transition-colors duration-300"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{book.author}</p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px] uppercase tracking-wider font-medium"
          >
            {LANG_LABELS[book.sourceLang] || book.sourceLang}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5 font-medium">
            <span className="uppercase tracking-wider">Progress</span>
            <span className="tabular-nums">
              {book.translatedChapters} / {book.totalChapters}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 shadow-sm"
            nativeButton={false}
            render={<Link href={`/read/${book.id}`}>Read</Link>}
          />
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:border-destructive/40"
            onClick={() => {
              if (confirm("Delete this book and all translations?")) {
                onDelete(book.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
