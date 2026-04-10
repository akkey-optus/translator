import { NextRequest, NextResponse } from "next/server";
import { uninstallDictionary } from "@/lib/dict/installer";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const removed = uninstallDictionary(id);
  if (!removed) {
    return NextResponse.json({ error: "Dictionary not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
