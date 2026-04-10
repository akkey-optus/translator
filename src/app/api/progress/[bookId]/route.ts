import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { readingProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const db = getDb();

  const progress = db
    .select()
    .from(readingProgress)
    .where(eq(readingProgress.bookId, bookId))
    .get();

  return NextResponse.json(progress || { chapterIndex: 0, scrollPosition: 0 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const body = await request.json();
  const db = getDb();

  const existing = db
    .select()
    .from(readingProgress)
    .where(eq(readingProgress.bookId, bookId))
    .get();

  if (existing) {
    db.update(readingProgress)
      .set({
        chapterIndex: body.chapterIndex ?? existing.chapterIndex,
        scrollPosition: body.scrollPosition ?? existing.scrollPosition,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(readingProgress.bookId, bookId))
      .run();
  } else {
    db.insert(readingProgress)
      .values({
        id: randomUUID(),
        bookId,
        chapterIndex: body.chapterIndex ?? 0,
        scrollPosition: body.scrollPosition ?? 0,
      })
      .run();
  }

  return NextResponse.json({ success: true });
}
