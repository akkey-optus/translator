import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

describe("database schema", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    sqlite = new Database(":memory:");
    db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder: "./drizzle" });
  });

  afterAll(() => {
    sqlite.close();
  });

  it("should insert and query a book", () => {
    const bookId = randomUUID();
    db.insert(schema.books).values({
      id: bookId,
      title: "転生したらスライムだった件",
      author: "伏瀬",
      sourceLang: "ja",
      filePath: "/uploads/test.epub",
      totalChapters: 10,
      status: "pending",
    }).run();

    const book = db.select().from(schema.books).where(eq(schema.books.id, bookId)).get();
    expect(book).toBeDefined();
    expect(book!.title).toBe("転生したらスライムだった件");
    expect(book!.sourceLang).toBe("ja");
  });

  it("should insert chapter with book FK", () => {
    const bookId = randomUUID();
    const chapterId = randomUUID();

    db.insert(schema.books).values({
      id: bookId, title: "Test", author: "A", sourceLang: "ja",
      filePath: "/test.epub", totalChapters: 1, status: "parsed",
    }).run();

    db.insert(schema.chapters).values({
      id: chapterId, bookId, index: 0, title: "Chapter 1",
      sourceHtml: "<p>Hello</p>", status: "pending",
    }).run();

    const chapter = db.select().from(schema.chapters).where(eq(schema.chapters.bookId, bookId)).get();
    expect(chapter).toBeDefined();
    expect(chapter!.title).toBe("Chapter 1");
  });

  it("should insert paragraph and translation", () => {
    const bookId = randomUUID();
    const chapterId = randomUUID();
    const paragraphId = randomUUID();
    const translationId = randomUUID();

    db.insert(schema.books).values({
      id: bookId, title: "Test", author: "A", sourceLang: "ja",
      filePath: "/t.epub", totalChapters: 1, status: "parsed",
    }).run();

    db.insert(schema.chapters).values({
      id: chapterId, bookId, index: 0, title: "Ch1",
      sourceHtml: "<p>テスト</p>", status: "done",
    }).run();

    db.insert(schema.paragraphs).values({
      id: paragraphId, chapterId, seq: 0,
      sourceText: "テスト", sourceMarkup: "<p>テスト</p>",
    }).run();

    db.insert(schema.translations).values({
      id: translationId, paragraphId, lang: "zh",
      text: "测试", status: "done", model: "claude-sonnet",
      tokensUsed: 50,
    }).run();

    const translation = db.select().from(schema.translations)
      .where(eq(schema.translations.paragraphId, paragraphId)).get();
    expect(translation).toBeDefined();
    expect(translation!.text).toBe("测试");
    expect(translation!.lang).toBe("zh");
  });

  it("should insert and query reading progress", () => {
    const bookId = randomUUID();
    const progressId = randomUUID();

    db.insert(schema.books).values({
      id: bookId, title: "Test", author: "A", sourceLang: "ja",
      filePath: "/t.epub", totalChapters: 5, status: "parsed",
    }).run();

    db.insert(schema.readingProgress).values({
      id: progressId, bookId, chapterIndex: 2, scrollPosition: 0.45,
    }).run();

    const progress = db.select().from(schema.readingProgress)
      .where(eq(schema.readingProgress.bookId, bookId)).get();
    expect(progress).toBeDefined();
    expect(progress!.chapterIndex).toBe(2);
    expect(progress!.scrollPosition).toBe(0.45);
  });
});
