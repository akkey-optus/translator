"use client";

interface ParagraphBlockProps {
  id: string;
  text: string;
  isHighlighted: boolean;
  onClick: (id: string) => void;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  status?: string;
}

export function ParagraphBlock({
  id,
  text,
  isHighlighted,
  onClick,
  fontSize,
  lineHeight,
  fontFamily,
  status,
}: ParagraphBlockProps) {
  return (
    <p
      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
        isHighlighted
          ? "bg-primary/10 border-l-[3px] border-primary"
          : "hover:bg-muted/50"
      } ${status === "processing" || status === "pending" ? "opacity-50" : ""}`}
      style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily }}
      onClick={() => onClick(id)}
    >
      {status === "processing" || status === "pending" ? (
        <span className="text-muted-foreground italic">Translating...</span>
      ) : (
        text
      )}
    </p>
  );
}
