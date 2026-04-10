import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { translations, paragraphs, chapters, books } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTranslationQueue } from "@/lib/queue/translation-queue";
import { checkChapterDone } from "@/lib/chapter-status";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const failedTranslations = db
    .select()
    .from(translations)
    .where(eq(translations.paragraphId, id))
    .all()
    .filter((t) => t.status === "failed");

  if (failedTranslations.length === 0) {
    return NextResponse.json({ error: "No failed translations" }, { status: 400 });
  }

  const para = db.select().from(paragraphs).where(eq(paragraphs.id, id)).get();
  if (!para) {
    return NextResponse.json({ error: "Paragraph not found" }, { status: 404 });
  }

  const chapter = db.select().from(chapters).where(eq(chapters.id, para.chapterId)).get();
  if (!chapter) {
    return NextResponse.json({ error: "Chapter missing" }, { status: 500 });
  }
  const book = db.select().from(books).where(eq(books.id, chapter.bookId)).get();
  if (!book) {
    return NextResponse.json({ error: "Book missing" }, { status: 500 });
  }
  const queue = getTranslationQueue();

  for (const t of failedTranslations) {
    db.update(translations)
      .set({ status: "pending", errorMessage: null, updatedAt: new Date().toISOString() })
      .where(eq(translations.id, t.id))
      .run();

    queue.add({
      translationId: t.id,
      text: para.sourceText,
      fromLang: book.sourceLang,
      toLang: t.lang,
      onComplete: (result) => {
        db.update(translations)
          .set({
            text: result.text,
            status: "done",
            model: result.model,
            tokensUsed: result.tokensUsed,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(translations.id, t.id))
          .run();
        checkChapterDone(para.chapterId);
      },
      onError: (error) => {
        db.update(translations)
          .set({
            status: "failed",
            errorMessage: error.message,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(translations.id, t.id))
          .run();
        checkChapterDone(para.chapterId);
      },
    });
  }

  return NextResponse.json({ retried: failedTranslations.length });
}
