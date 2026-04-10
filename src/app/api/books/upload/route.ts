import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureDataDir } from "@/lib/db/init";
import { books, chapters, paragraphs } from "@/lib/db/schema";
import { parseEpub } from "@/lib/epub/parser";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  ensureDataDir();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  if (!file.name.endsWith(".epub")) {
    return NextResponse.json({ error: "Only EPUB files are supported" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file
    const bookId = randomUUID();
    const fileName = `${bookId}.epub`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, fileName);
    await fs.writeFile(filePath, buffer);

    // Parse EPUB
    const parsed = await parseEpub(buffer);

    const db = getDb();

    // Insert book
    db.insert(books)
      .values({
        id: bookId,
        title: parsed.title,
        author: parsed.author,
        sourceLang: parsed.language.substring(0, 2).toLowerCase(),
        filePath: fileName,
        totalChapters: parsed.chapters.length,
        status: "parsed",
      })
      .run();

    // Insert all chapters and first chapter's paragraphs
    for (let i = 0; i < parsed.chapters.length; i++) {
      const ch = parsed.chapters[i];
      const chapterId = randomUUID();

      db.insert(chapters)
        .values({
          id: chapterId,
          bookId,
          index: i,
          title: ch.title,
          sourceHtml: ch.sourceHtml,
          status: "pending",
        })
        .run();

      // Only parse paragraphs for first chapter immediately
      if (i === 0) {
        for (let j = 0; j < ch.paragraphs.length; j++) {
          db.insert(paragraphs)
            .values({
              id: randomUUID(),
              chapterId,
              seq: j,
              sourceText: ch.paragraphs[j].text,
              sourceMarkup: ch.paragraphs[j].markup,
            })
            .run();
        }
      }
    }

    return NextResponse.json({
      id: bookId,
      title: parsed.title,
      author: parsed.author,
      sourceLang: parsed.language,
      totalChapters: parsed.chapters.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to parse EPUB" },
      { status: 500 },
    );
  }
}
