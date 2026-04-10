import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureDataDir } from "@/lib/db/init";
import { books, chapters } from "@/lib/db/schema";
import { desc, eq, and, count } from "drizzle-orm";

export async function GET() {
  ensureDataDir();
  const db = getDb();

  const allBooks = db
    .select({
      id: books.id,
      title: books.title,
      author: books.author,
      sourceLang: books.sourceLang,
      coverPath: books.coverPath,
      totalChapters: books.totalChapters,
      status: books.status,
      createdAt: books.createdAt,
    })
    .from(books)
    .orderBy(desc(books.createdAt))
    .all();

  // Count "done" chapters per book
  const booksWithProgress = allBooks.map((book) => {
    const doneChapters = db
      .select({ count: count() })
      .from(chapters)
      .where(and(eq(chapters.bookId, book.id), eq(chapters.status, "done")))
      .all();

    return {
      ...book,
      translatedChapters: doneChapters[0]?.count || 0,
    };
  });

  return NextResponse.json(booksWithProgress);
}
