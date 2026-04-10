"use client";

import { ParagraphBlock } from "./ParagraphBlock";

interface Paragraph {
  id: string;
  seq: number;
  sourceText: string;
  translations: Record<string, { text: string; status: string }>;
}

const SPACING_CLASS: Record<"compact" | "standard" | "relaxed", string> = {
  compact: "mb-2",
  standard: "mb-4",
  relaxed: "mb-8",
};

interface ColumnViewProps {
  lang: string;
  label: string;
  sourceLang: string;
  paragraphs: Paragraph[];
  highlightedId: string | null;
  onParagraphClick: (id: string) => void;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  paragraphSpacing: "compact" | "standard" | "relaxed";
}

export function ColumnView({
  lang,
  label,
  sourceLang,
  paragraphs,
  highlightedId,
  onParagraphClick,
  fontSize,
  lineHeight,
  fontFamily,
  paragraphSpacing,
}: ColumnViewProps) {
  return (
    <div className="flex-1 px-5 py-4 overflow-y-auto">
      <div className="text-center text-xs text-muted-foreground uppercase mb-3 font-sans">
        {label}
      </div>
      <div>
        {paragraphs.map((p) => {
          const isSource = lang === sourceLang;
          const text = isSource
            ? p.sourceText
            : p.translations[lang]?.text || "";
          const status = isSource ? "done" : p.translations[lang]?.status || "pending";

          return (
            <div key={p.id} className={SPACING_CLASS[paragraphSpacing]}>
              <ParagraphBlock
                id={p.id}
                text={text}
                isHighlighted={highlightedId === p.id}
                onClick={onParagraphClick}
                fontSize={fontSize}
                lineHeight={lineHeight}
                fontFamily={fontFamily}
                status={status}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
