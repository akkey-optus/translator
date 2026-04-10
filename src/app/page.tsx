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
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">三語リーダー</h1>
          <p className="text-muted-foreground">Trilingual EPUB Reader</p>
        </div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">Settings</Link>
      </header>

      <section className="mb-8">
        <UploadZone onUploadComplete={fetchBooks} />
      </section>

      {books.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-4">Library</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-center text-muted-foreground py-12">
          Upload an EPUB to get started
        </p>
      )}
    </div>
  );
}
