"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar, ViewMode } from "./TopBar";
import { BottomBar } from "./BottomBar";
import { ChapterSidebar } from "./ChapterSidebar";
import { ColumnView } from "./ColumnView";
import { SettingsDrawer, ReaderSettings } from "./SettingsDrawer";

interface Chapter {
  id: string;
  index: number;
  title: string;
  status: string;
}

interface Paragraph {
  id: string;
  seq: number;
  sourceText: string;
  translations: Record<string, { text: string; status: string }>;
}

interface ChapterContent {
  id: string;
  title: string;
  status: string;
  paragraphs: Paragraph[];
}

interface ReaderLayoutProps {
  bookId: string;
  bookTitle: string;
  sourceLang: string;
  chapters: Chapter[];
  initialChapterIndex: number;
}

const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  zh: "中文",
  en: "English",
};

const ALL_LANGS = ["ja", "zh", "en"];

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  lineHeight: 1.8,
  paragraphSpacing: "standard",
  theme: "dark",
  fonts: { ja: "var(--font-noto-jp), serif", zh: "var(--font-noto-sc), serif", en: "Georgia, serif" },
};

export function ReaderLayout({
  bookId,
  bookTitle,
  sourceLang,
  chapters,
  initialChapterIndex,
}: ReaderLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(initialChapterIndex);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("triple");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  const currentChapter = chapters.find((ch) => ch.index === currentIndex);

  // Determine which languages to show
  const visibleLangs = (() => {
    const otherLangs = ALL_LANGS.filter((l) => l !== sourceLang);
    if (viewMode === "single") return [sourceLang];
    if (viewMode === "dual") return [sourceLang, otherLangs[0]];
    return [sourceLang, ...otherLangs];
  })();

  // Fetch chapter content
  const fetchContent = useCallback(async (chapterId: string) => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}`);
      if (res.ok) {
        setContent(await res.json());
      } else {
        console.error(`Failed to fetch chapter ${chapterId}: ${res.status}`);
      }
    } catch (err) {
      console.error(`Error fetching chapter ${chapterId}:`, err);
    }
  }, []);

  // Trigger translation
  const triggerTranslation = useCallback(async (chapterId: string) => {
    await fetch(`/api/chapters/${chapterId}/translate`, { method: "POST" });
  }, []);

  // Load chapter when index changes
  useEffect(() => {
    const ch = chapters.find((c) => c.index === currentIndex);
    if (!ch) return;

    fetchContent(ch.id).catch(() => {});

    // Trigger translation if needed
    if (ch.status === "pending") {
      triggerTranslation(ch.id).catch(() => {});
    }

    // Save progress
    fetch(`/api/progress/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterIndex: currentIndex }),
    }).catch(() => {});

    // Prefetch next chapter
    const nextCh = chapters.find((c) => c.index === currentIndex + 1);
    if (nextCh && nextCh.status === "pending") {
      triggerTranslation(nextCh.id).catch(() => {});
    }
  }, [currentIndex, chapters, bookId, fetchContent, triggerTranslation]);

  // Poll for translation status
  useEffect(() => {
    if (!currentChapter || !content) return;
    if (content.status === "done") return;

    const interval = setInterval(() => {
      if (!currentChapter) return;
      fetchContent(currentChapter.id).catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [currentChapter, content, fetchContent]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        bookTitle={bookTitle}
        chapterTitle={currentChapter?.title || ""}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <ChapterSidebar
          chapters={chapters}
          currentIndex={currentIndex}
          onSelect={setCurrentIndex}
          isOpen={sidebarOpen}
        />

        <div className="flex flex-1 overflow-hidden divide-x divide-border">
          {content && content.paragraphs.length > 0 ? (
            visibleLangs.map((lang) => (
              <ColumnView
                key={lang}
                lang={lang}
                label={LANG_LABELS[lang] || lang}
                sourceLang={sourceLang}
                paragraphs={content.paragraphs}
                highlightedId={highlightedId}
                onParagraphClick={setHighlightedId}
                fontSize={settings.fontSize}
                lineHeight={settings.lineHeight}
                fontFamily={settings.fonts[lang as keyof typeof settings.fonts] || "serif"}
                paragraphSpacing={settings.paragraphSpacing}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {content ? "No paragraphs" : "Loading..."}
            </div>
          )}
        </div>
      </div>

      <BottomBar
        currentIndex={currentIndex}
        totalChapters={chapters.length}
        onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(chapters.length - 1, i + 1))}
      />

      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
