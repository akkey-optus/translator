import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const EXPORT_DIR = path.join(process.cwd(), "data", "exports");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const url = new URL(request.url);
  const fileName = url.searchParams.get("file");

  if (!fileName) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }

  const safeName = path.basename(fileName);

  // Must be a real export for this book: <bookId>.(json|zip)
  if (!safeName.startsWith(`${bookId}.`) || !(safeName.endsWith(".json") || safeName.endsWith(".zip"))) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const filePath = path.join(EXPORT_DIR, safeName);

  // Defense-in-depth: ensure resolved path is inside EXPORT_DIR
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(EXPORT_DIR) + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(filePath);
    const contentType = safeName.endsWith(".zip") ? "application/zip" : "application/json";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
