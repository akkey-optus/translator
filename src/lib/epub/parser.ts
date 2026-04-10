import JSZip from "jszip";
import * as cheerio from "cheerio";

export interface ParsedParagraph {
  text: string;
  markup: string;
}

export interface ParsedChapter {
  title: string;
  sourceHtml: string;
  paragraphs: ParsedParagraph[];
}

export interface ParsedEpub {
  title: string;
  author: string;
  language: string;
  chapters: ParsedChapter[];
  coverPath?: string;
}

export async function parseEpub(buffer: Buffer): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Read container.xml to find OPF path
  const containerXml = await zip.file("META-INF/container.xml")!.async("text");
  const $container = cheerio.load(containerXml, { xmlMode: true });
  const opfPath = $container("rootfile").attr("full-path")!;
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

  // 2. Parse OPF for metadata, manifest, spine
  const opfXml = await zip.file(opfPath)!.async("text");
  const $opf = cheerio.load(opfXml, { xmlMode: true });

  const title = $opf("dc\\:title, title").first().text() || "Untitled";
  const author = $opf("dc\\:creator, creator").first().text() || "Unknown";
  const language = $opf("dc\\:language, language").first().text() || "en";

  // Build manifest map: id -> href
  const manifest = new Map<string, string>();
  $opf("manifest item").each((_, el) => {
    const id = $opf(el).attr("id")!;
    const href = $opf(el).attr("href")!;
    manifest.set(id, href);
  });

  // Spine order
  const spineIds: string[] = [];
  $opf("spine itemref").each((_, el) => {
    spineIds.push($opf(el).attr("idref")!);
  });

  // 3. Try to extract chapter titles from NCX/NAV
  const tocId = $opf("spine").attr("toc");
  const tocTitles = new Map<string, string>();

  if (tocId && manifest.has(tocId)) {
    const tocPath = opfDir + manifest.get(tocId)!;
    const tocFile = zip.file(tocPath);
    if (tocFile) {
      const tocXml = await tocFile.async("text");
      const $toc = cheerio.load(tocXml, { xmlMode: true });
      $toc("navPoint").each((_, el) => {
        const label = $toc(el).find("navLabel text").first().text().trim();
        const src = $toc(el).find("content").first().attr("src");
        if (label && src) {
          // Remove fragment (#...) from src
          const cleanSrc = src.split("#")[0];
          tocTitles.set(cleanSrc, label);
        }
      });
    }
  }

  // 4. Parse each spine item
  const chapters: ParsedChapter[] = [];
  for (let i = 0; i < spineIds.length; i++) {
    const href = manifest.get(spineIds[i]);
    if (!href) continue;

    const filePath = opfDir + href;
    const file = zip.file(filePath);
    if (!file) continue;

    const html = await file.async("text");
    const $ch = cheerio.load(html, { xmlMode: true });

    // Extract title: prefer TOC title, fallback to first h1/h2/h3
    const tocTitle = tocTitles.get(href);
    const headingTitle = $ch("h1, h2, h3").first().text().trim();
    const chapterTitle = tocTitle || headingTitle || `Chapter ${i + 1}`;

    // Extract paragraphs from <p> tags
    const paragraphs: ParsedParagraph[] = [];
    $ch("body p").each((_, el) => {
      const $el = $ch(el);
      const text = $el.text().trim();
      if (text.length === 0) return;

      const markup = $ch.html(el) || "";
      paragraphs.push({ text, markup });
    });

    chapters.push({
      title: chapterTitle,
      sourceHtml: html,
      paragraphs,
    });
  }

  return { title, author, language, chapters };
}
