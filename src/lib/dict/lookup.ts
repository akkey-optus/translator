import { getSqlite } from "@/lib/db";
import { getBaseForms } from "./kuromoji";

export interface DictLookupResult {
  dictionaryId: string;
  dictionaryName: string;
  headword: string;
  reading: string;
  gloss: string;
}

interface DictRow {
  dictionary_id: string;
  headword: string;
  reading: string;
  gloss: string;
}

/**
 * Look up a word in all installed dictionaries for the given language.
 *
 * - For Japanese, we first tokenize with kuromoji to recover dictionary
 *   (basic) forms, then search by headword equality.
 * - For Chinese/English, we search on the raw input (optionally trimmed
 *   and lowercased for English).
 *
 * We use `headword = ?` equality against the FTS5 table because that's
 * what users want in 99% of cases. FTS5 fuzzy MATCH is overkill here and
 * produces noisier results.
 */
export async function lookupWord(params: {
  lang: string;
  query: string;
}): Promise<DictLookupResult[]> {
  const { lang } = params;
  const rawQuery = params.query.trim();
  if (!rawQuery) return [];

  // Build the list of candidate headwords to try.
  let candidates: string[] = [rawQuery];
  if (lang === "ja") {
    try {
      const bases = await getBaseForms(rawQuery);
      candidates = Array.from(new Set([rawQuery, ...bases]));
    } catch (err) {
      console.error("[dict] kuromoji failed, falling back to raw query:", err);
    }
  } else if (lang === "en") {
    candidates = [rawQuery.toLowerCase()];
  }

  const sqlite = getSqlite();

  // Restrict lookups to dictionaries matching the query language to avoid
  // accidentally returning Chinese entries for Japanese input.
  const dictRows = sqlite
    .prepare("SELECT id, name FROM dictionaries WHERE source_lang = ?")
    .all(lang) as Array<{ id: string; name: string }>;

  if (dictRows.length === 0) return [];

  const dictIds = dictRows.map((d) => d.id);
  const dictNameById = new Map(dictRows.map((d) => [d.id, d.name]));

  const placeholders = dictIds.map(() => "?").join(",");
  const selectStmt = sqlite.prepare(
    `SELECT dictionary_id, headword, reading, gloss
       FROM dict_entries
      WHERE dictionary_id IN (${placeholders}) AND headword = ?`,
  );

  // Dedup on (dictionary_id, headword, gloss) so variant candidates don't
  // produce duplicate rows when they both resolve to the same entry.
  const seen = new Set<string>();
  const results: DictLookupResult[] = [];

  for (const candidate of candidates) {
    const rows = selectStmt.all(...dictIds, candidate) as DictRow[];
    for (const row of rows) {
      const key = `${row.dictionary_id}::${row.headword}::${row.gloss}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        dictionaryId: row.dictionary_id,
        dictionaryName: dictNameById.get(row.dictionary_id) ?? "",
        headword: row.headword,
        reading: row.reading,
        gloss: row.gloss,
      });
    }
  }

  return results;
}
