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
  errorMessage?: string | null;
  onRetry?: (paragraphId: string) => void;
  retrying?: boolean;
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
  errorMessage,
  onRetry,
  retrying,
}: ParagraphBlockProps) {
  const isLoading = status === "processing" || status === "pending";
  const isFailed = status === "failed";

  if (isFailed) {
    return (
      <div
        className={`px-3 py-2 rounded border border-destructive/40 bg-destructive/5 ${
          isHighlighted ? "border-l-[3px] border-l-primary" : ""
        }`}
        style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily }}
        onClick={() => onClick(id)}
      >
        <div className="text-destructive text-sm font-sans flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium">Translation failed</div>
            {errorMessage && (
              <div className="text-xs text-destructive/80 mt-0.5 break-words">
                {errorMessage}
              </div>
            )}
          </div>
          {onRetry && (
            <button
              type="button"
              disabled={retrying}
              onClick={(e) => {
                e.stopPropagation();
                onRetry(id);
              }}
              className="text-xs px-2 py-1 rounded border border-destructive/40 hover:bg-destructive/10 disabled:opacity-50 shrink-0"
            >
              {retrying ? "Retrying…" : "Retry"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <p
      className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-300 ease-out ${
        isHighlighted
          ? "bg-primary/10 ring-1 ring-primary/20"
          : "hover:bg-muted/40"
      } ${isLoading ? "opacity-60" : ""}`}
      style={{ fontSize: `${fontSize}px`, lineHeight, fontFamily }}
      onClick={() => onClick(id)}
    >
      {isHighlighted && (
        <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-primary" />
      )}
      {isLoading ? (
        <span className="inline-block text-muted-foreground italic animate-pulse">
          Translating…
        </span>
      ) : (
        text
      )}
    </p>
  );
}
