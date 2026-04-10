import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { ensureDataDir } from "@/lib/db/init";
import { vocabulary } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  ensureDataDir();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang");

  const query = db.select().from(vocabulary);
  const rows = lang
    ? query.where(eq(vocabulary.lang, lang)).orderBy(desc(vocabulary.createdAt)).all()
    : query.orderBy(desc(vocabulary.createdAt)).all();

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  ensureDataDir();
  const db = getDb();

  let body: {
    word?: string;
    lang?: string;
    reading?: string | null;
    gloss?: string;
    note?: string | null;
    sourceBookId?: string | null;
    sourceContext?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { word, lang, gloss } = body;
  if (!word || !lang || !gloss) {
    return NextResponse.json(
      { error: "`word`, `lang`, and `gloss` are required" },
      { status: 400 },
    );
  }

  // Dedup: if the same (word, lang) already exists, update it instead of
  // inserting a duplicate row. This keeps the vocabulary list clean when
  // users tap the same word from different chapters.
  const existing = db
    .select()
    .from(vocabulary)
    .where(and(eq(vocabulary.word, word), eq(vocabulary.lang, lang)))
    .get();

  if (existing) {
    db.update(vocabulary)
      .set({
        reading: body.reading ?? existing.reading,
        gloss,
        note: body.note ?? existing.note,
        sourceBookId: body.sourceBookId ?? existing.sourceBookId,
        sourceContext: body.sourceContext ?? existing.sourceContext,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(vocabulary.id, existing.id))
      .run();
    return NextResponse.json({ id: existing.id, updated: true });
  }

  const id = randomUUID();
  db.insert(vocabulary)
    .values({
      id,
      word,
      lang,
      reading: body.reading ?? null,
      gloss,
      note: body.note ?? null,
      sourceBookId: body.sourceBookId ?? null,
      sourceContext: body.sourceContext ?? null,
    })
    .run();

  return NextResponse.json({ id, created: true });
}
