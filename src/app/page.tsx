"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UploadZone } from "@/components/UploadZone";
import { BookCard } from "@/components/BookCard";

interface Book {
  id: string;
  title: string;
  author: string;
  sourceLang: string;
  totalChapters: number;
  translatedChapters: number;
  status: string;
}

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);

  const fetchBooks = useCallback(async () => {
    const res = await fetch("/api/books");
    if (res.ok) {
      setBooks(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.ok) fetchBooks();
  };

  return (
    <div className="min-h-screen px-6 py-10 sm:py-14 max-w-6xl mx-auto">
      <header className="mb-12 flex items-start justify-between gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h1
            className="text-4xl sm:text-5xl font-medium tracking-tight"
            style={{ fontFamily: "var(--font-noto-jp), serif" }}
          >
            三語リーダー
          </h1>
          <p
            className="mt-2 text-muted-foreground text-base italic"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Trilingual EPUB Reader
          </p>
        </div>
        <nav className="flex items-center gap-1 text-sm animate-in fade-in duration-700 delay-100">
          {[
            { href: "/dictionary", label: "Dictionaries" },
            { href: "/vocabulary", label: "Vocabulary" },
            { href: "/settings", label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="mb-12 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">
        <UploadZone onUploadComplete={fetchBooks} />
      </section>

      {books.length > 0 ? (
        <section>
          <h2
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5 animate-in fade-in duration-700 delay-200"
          >
            Library
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {books.map((book, i) => (
              <div
                key={book.id}
                className="stagger-fade-in"
                style={{ animationDelay: `${250 + i * 60}ms` }}
              >
                <BookCard book={book} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 animate-in fade-in duration-700 delay-200">
          <p
            className="text-muted-foreground italic text-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your library is empty.
          </p>
          <p className="text-muted-foreground/70 text-sm mt-1">
            Upload an EPUB above to begin.
          </p>
        </div>
      )}
    </div>
  );
}
