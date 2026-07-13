import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, productSlug, sku } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح" },
        { status: 400 }
      );
    }

    if (!productSlug || !sku) {
      return NextResponse.json(
        { error: "بيانات المنتج غير مكتملة" },
        { status: 400 }
      );
    }

    // TODO: Wire to actual Restock Notification API / CRM
    // Simulating API latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    return NextResponse.json(
      { success: true, message: "تم تسجيلك! سنرسل رسالة فور توفر المنتج." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ داخلي، يرجى المحاولة لاحقاً" },
      { status: 500 }
    );
  }
}
