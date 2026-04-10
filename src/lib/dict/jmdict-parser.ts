import type { ParsedDictEntry } from "./types";

/**
 * JMdict entry structure (simplified):
 *   <entry>
 *     <ent_seq>1000000</ent_seq>
 *     <k_ele><keb>行く</keb></k_ele>        -- kanji form(s), optional
 *     <r_ele><reb>いく</reb></r_ele>        -- reading form(s), at least one
 *     <sense>
 *       <pos>&v5k-s;</pos>
 *       <gloss>to go</gloss>                 -- one or more glosses
 *       <gloss>to move</gloss>
 *     </sense>
 *   </entry>
 *
 * We emit one entry per headword (kanji form, or reading if no kanji).
 * The same word may appear multiple times when it has multiple kanji
 * variants (e.g. 行く and 往く) — each gets its own FTS5 row so lookups
 * work regardless of which form the user selected.
 *
 * Parsing strategy: we load the whole XML blob into memory (~30MB for
 * JMdict_e), split on `</entry>`, and pick data out of each chunk with
 * targeted regexes. This avoids the memory cost of a full DOM tree while
 * still being simple to reason about.
 */

const KEB_REGEX = /<keb>([^<]+)<\/keb>/g;
const REB_REGEX = /<reb>([^<]+)<\/reb>/g;
const GLOSS_REGEX = /<gloss(?:\s[^>]*)?>([^<]+)<\/gloss>/g;
const ENTRY_OPEN = "<entry>";

function extractAll(source: string, regex: RegExp): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((match = regex.exec(source)) !== null) {
    results.push(decodeXmlEntities(match[1].trim()));
  }
  return results;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parseJMdictEntry(entryXml: string): ParsedDictEntry[] {
  const kanjiForms = extractAll(entryXml, KEB_REGEX);
  const readings = extractAll(entryXml, REB_REGEX);
  const glosses = extractAll(entryXml, GLOSS_REGEX);

  if (glosses.length === 0) return [];

  const gloss = glosses.join("; ");
  const reading = readings[0] ?? "";
  // If there are kanji forms, each is a lookup key. Otherwise the reading
  // itself is the headword (e.g. pure kana words like こんにちは).
  const headwords = kanjiForms.length > 0 ? kanjiForms : readings;

  return headwords.map((headword) => ({ headword, reading, gloss }));
}

export function* parseJMdict(xml: string): Generator<ParsedDictEntry> {
  const chunks = xml.split("</entry>");
  for (const chunk of chunks) {
    const start = chunk.indexOf(ENTRY_OPEN);
    if (start === -1) continue;
    const entryXml = chunk.slice(start + ENTRY_OPEN.length);
    for (const entry of parseJMdictEntry(entryXml)) {
      yield entry;
    }
  }
}
