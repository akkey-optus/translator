import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default("Unknown"),
  sourceLang: text("source_lang").notNull(), // ja | zh | en
  coverPath: text("cover_path"),
  filePath: text("file_path").notNull(),
  totalChapters: integer("total_chapters").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | parsed | error
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  index: integer("index").notNull(),
  title: text("title").notNull(),
  sourceHtml: text("source_html").notNull(),
  status: text("status").notNull().default("pending"), // pending | translating | done | error
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const paragraphs = sqliteTable("paragraphs", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull(),
  sourceText: text("source_text").notNull(),
  sourceMarkup: text("source_markup").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const translations = sqliteTable("translations", {
  id: text("id").primaryKey(),
  paragraphId: text("paragraph_id").notNull().references(() => paragraphs.id, { onDelete: "cascade" }),
  lang: text("lang").notNull(), // zh | en | ja
  text: text("text").notNull().default(""),
  status: text("status").notNull().default("pending"), // pending | processing | done | failed
  model: text("model"),
  tokensUsed: integer("tokens_used"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const readingProgress = sqliteTable("reading_progress", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  chapterIndex: integer("chapter_index").notNull().default(0),
  scrollPosition: real("scroll_position").notNull().default(0),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const dictionaries = sqliteTable("dictionaries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  format: text("format").notNull(), // 'jmdict' | 'cedict'
  sourceLang: text("source_lang").notNull(), // 'ja' | 'zh'
  entryCount: integer("entry_count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Note: dict_entries is an FTS5 virtual table created via raw SQL migration.
// Drizzle's schema DSL does not support FTS5, so we interact with it via
// sqlite.prepare() directly in src/lib/dict/*.

export const vocabulary = sqliteTable("vocabulary", {
  id: text("id").primaryKey(),
  word: text("word").notNull(),
  lang: text("lang").notNull(), // 'ja' | 'zh' | 'en'
  reading: text("reading"),
  gloss: text("gloss").notNull(),
  note: text("note"),
  sourceBookId: text("source_book_id"), // nullable, no cascade
  sourceContext: text("source_context"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});
