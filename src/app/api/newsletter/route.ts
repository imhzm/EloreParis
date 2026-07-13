import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح" },
        { status: 400 }
      );
    }

    // TODO: Wire to actual CRM or Email Marketing API (e.g. Klaviyo, Mailchimp)
    // Simulating API latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json(
      { success: true, message: "تم تسجيلك بنجاح! سنتواصل معك قريبًا." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ داخلي، يرجى المحاولة لاحقاً" },
      { status: 500 }
    );
  }
}
