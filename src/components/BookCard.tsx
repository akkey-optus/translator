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
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{book.title}</h3>
            <p className="text-sm text-muted-foreground">{book.author}</p>
          </div>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {LANG_LABELS[book.sourceLang] || book.sourceLang}
          </Badge>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Translation progress</span>
            <span>
              {book.translatedChapters} / {book.totalChapters} chapters
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            nativeButton={false}
            render={<Link href={`/read/${book.id}`}>Read</Link>}
          />
          <Button
            variant="outline"
            size="sm"
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
