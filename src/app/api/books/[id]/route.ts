import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { books, chapters } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const book = db.select().from(books).where(eq(books.id, id)).get();
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const chapterList = db
    .select({
      id: chapters.id,
      index: chapters.index,
      title: chapters.title,
      status: chapters.status,
    })
    .from(chapters)
    .where(eq(chapters.bookId, id))
    .orderBy(chapters.index)
    .all();

  return NextResponse.json({ ...book, chapters: chapterList });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const book = db.select().from(books).where(eq(books.id, id)).get();
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Delete file
  try {
    const filePath = path.join(process.cwd(), "data", "uploads", book.filePath);
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted
  }

  // Cascade delete handles chapters, paragraphs, translations
  db.delete(books).where(eq(books.id, id)).run();

  return NextResponse.json({ success: true });
}
