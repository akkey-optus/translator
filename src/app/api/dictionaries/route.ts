import { NextRequest, NextResponse } from "next/server";
import { ensureDataDir } from "@/lib/db/init";
import { installDictionary, listDictionaries } from "@/lib/dict/installer";
import { detectDictFormat } from "@/lib/dict/format-detect";
import { gunzipSync } from "zlib";

const MAX_SIZE = 80 * 1024 * 1024; // 80MB (JMdict decompressed ~30MB, CEDICT ~8MB)

export async function GET() {
  ensureDataDir();
  const dicts = listDictionaries();
  return NextResponse.json(dicts);
}

export async function POST(request: NextRequest) {
  ensureDataDir();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const customName = formData.get("name") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 80MB)" }, { status: 400 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());

    // gzip-decompress if the file name ends with .gz OR the magic bytes match.
    const isGzip =
      file.name.toLowerCase().endsWith(".gz") ||
      (raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b);
    const decompressed = isGzip ? gunzipSync(raw) : raw;
    const text = decompressed.toString("utf-8");

    const info = detectDictFormat(text);
    if (!info) {
      return NextResponse.json(
        { error: "Unrecognized dictionary format. Supported: JMdict (XML), CC-CEDICT (text)." },
        { status: 400 },
      );
    }

    const result = installDictionary({
      name: customName?.trim() || info.suggestedName,
      format: info.format,
      sourceLang: info.sourceLang,
      text,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Dictionary upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to install dictionary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
