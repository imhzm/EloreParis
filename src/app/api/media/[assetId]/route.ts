import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MediaAuthorityError, readApprovedMediaAsset } from "@/lib/media-authority";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MediaRouteContext = { params: Promise<{ assetId: string }> };

export async function GET(_request: NextRequest, context: MediaRouteContext) {
  try {
    const { assetId } = await context.params;
    const record = await readApprovedMediaAsset(assetId);
    if (!record) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
    return new NextResponse(new Uint8Array(record.bytes), {
      headers: {
        "Content-Type": record.asset.mimeType,
        "Content-Length": String(record.bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `\"${record.sha256}\"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof MediaAuthorityError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Media authority failed." }, { status: 500 });
  }
}
