import { NextRequest, NextResponse } from "next/server";
import { exportJson, exportHtmlZip } from "@/lib/export/exporter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { bookId } = await params;
  const body = await request.json();
  const format = body.format || "json";

  try {
    const fileName = format === "html" ? await exportHtmlZip(bookId) : await exportJson(bookId);
    return NextResponse.json({ fileName, format });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
