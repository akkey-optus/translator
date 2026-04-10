export interface ParsedDictEntry {
  headword: string;
  reading: string;
  gloss: string;
}

export type DictFormat = "cedict" | "jmdict";
export type DictSourceLang = "ja" | "zh";

export interface DictFormatInfo {
  format: DictFormat;
  sourceLang: DictSourceLang;
  suggestedName: string;
}
