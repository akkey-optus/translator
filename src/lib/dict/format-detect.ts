import type { DictFormatInfo } from "./types";

/**
 * Peek at the first ~2KB of a decompressed dictionary file and decide
 * whether it's JMdict (XML) or CC-CEDICT (line-based text). Returns null
 * if neither format matches.
 */
export function detectDictFormat(sample: string): DictFormatInfo | null {
  const head = sample.slice(0, 4096);

  // JMdict XML — look for the root tag or DOCTYPE declaration.
  if (/<JMdict\b/.test(head) || /<!DOCTYPE\s+JMdict/.test(head)) {
    return {
      format: "jmdict",
      sourceLang: "ja",
      suggestedName: "JMdict",
    };
  }

  // CC-CEDICT — starts with `#` comment lines, then entries in the form
  // `traditional simplified [pinyin] /gloss/`.
  const cedictHeader = /^#\s*CC-CEDICT/m.test(head);
  const cedictLine = /^\S+\s+\S+\s+\[[^\]]+\]\s+\//m.test(head);
  if (cedictHeader || cedictLine) {
    return {
      format: "cedict",
      sourceLang: "zh",
      suggestedName: "CC-CEDICT",
    };
  }

  return null;
}
