import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { vocabulary } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();

  let body: {
    word?: string;
    reading?: string | null;
    gloss?: string;
    note?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = db.select().from(vocabulary).where(eq(vocabulary.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.update(vocabulary)
    .set({
      word: body.word ?? existing.word,
      reading: body.reading !== undefined ? body.reading : existing.reading,
      gloss: body.gloss ?? existing.gloss,
      note: body.note !== undefined ? body.note : existing.note,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(vocabulary.id, id))
    .run();

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const result = db.delete(vocabulary).where(eq(vocabulary.id, id)).run();
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
