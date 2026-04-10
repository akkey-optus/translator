import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { books, chapters, paragraphs, translations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTranslationQueue } from "@/lib/queue/translation-queue";
import { checkChapterDone } from "@/lib/chapter-status";
import { randomUUID } from "crypto";

const TARGET_LANGS: Record<string, string[]> = {
  ja: ["zh", "en"],
  zh: ["ja", "en"],
  en: ["ja", "zh"],
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  const chapter = db.select().from(chapters).where(eq(chapters.id, id)).get();
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const book = db.select().from(books).where(eq(books.id, chapter.bookId)).get();
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Parse paragraphs if not already done
  let paras = db
    .select()
    .from(paragraphs)
    .where(eq(paragraphs.chapterId, id))
    .orderBy(paragraphs.seq)
    .all();

  if (paras.length === 0) {
    // Re-parse chapter from source HTML
    const $ = await import("cheerio").then((m) => m.load(chapter.sourceHtml, { xmlMode: true }));
    const extracted: { text: string; markup: string }[] = [];
    $("body p, p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length === 0) return;
      const markup = $.html(el) || "";
      extracted.push({ text, markup });
    });

    for (let j = 0; j < extracted.length; j++) {
      db.insert(paragraphs)
        .values({
          id: randomUUID(),
          chapterId: id,
          seq: j,
          sourceText: extracted[j].text,
          sourceMarkup: extracted[j].markup,
        })
        .run();
    }

    paras = db
      .select()
      .from(paragraphs)
      .where(eq(paragraphs.chapterId, id))
      .orderBy(paragraphs.seq)
      .all();
  }

  // Create translation records and queue jobs
  const sourceLang = book.sourceLang;
  const targetLangs = TARGET_LANGS[sourceLang] || ["zh", "en"];
  const queue = getTranslationQueue();

  let queued = 0;
  for (const para of paras) {
    const existingForPara = db
      .select()
      .from(translations)
      .where(eq(translations.paragraphId, para.id))
      .all();
    for (const lang of targetLangs) {
      // Check if translation already exists and is done
      const existing = existingForPara.find((t) => t.lang === lang);

      if (existing && existing.status === "done") continue;

      const translationId = existing?.id || randomUUID();

      if (!existing) {
        db.insert(translations)
          .values({
            id: translationId,
            paragraphId: para.id,
            lang,
            status: "pending",
          })
          .run();
      } else {
        db.update(translations)
          .set({ status: "pending", errorMessage: null, updatedAt: new Date().toISOString() })
          .where(eq(translations.id, translationId))
          .run();
      }

      queue.add({
        translationId,
        text: para.sourceText,
        fromLang: sourceLang,
        toLang: lang,
        onComplete: (result) => {
          db.update(translations)
            .set({
              text: result.text,
              status: "done",
              model: result.model,
              tokensUsed: result.tokensUsed,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(translations.id, translationId))
            .run();

          // Check if chapter is fully done
          checkChapterDone(id);
        },
        onError: (error) => {
          db.update(translations)
            .set({
              status: "failed",
              errorMessage: error.message,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(translations.id, translationId))
            .run();
          checkChapterDone(id);
        },
      });

      queued++;
    }
  }

  // Update chapter status
  db.update(chapters)
    .set({ status: "translating", updatedAt: new Date().toISOString() })
    .where(eq(chapters.id, id))
    .run();

  return NextResponse.json({ queued, totalParagraphs: paras.length });
}
