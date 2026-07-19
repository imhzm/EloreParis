import { ImageResponse } from "next/og";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

export const alt = "ÉLORÉ PARIS | بطاقة مشاركة / Social preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const socialCardCopy: Record<
  Locale,
  {
    direction: "rtl" | "ltr";
    market: string;
    title: string;
    description: string;
    categories: string;
  }
> = {
  ar: {
    direction: "rtl",
    market: "المملكة العربية السعودية",
    title: "جمالٌ يُروى كتجربة.",
    description:
      "طقس باريسي بروح سعودية، مع إرشاد أوضح حول القوام والدرجة والروتين قبل الاختيار.",
    categories: "العناية · المكياج · الهدايا",
  },
  en: {
    direction: "ltr",
    market: "SAUDI ARABIA",
    title: "Beauty, composed with intention.",
    description:
      "Parisian ritual. Saudi relevance. Clearer texture, shade and routine guidance before you choose.",
    categories: "SKINCARE · MAKEUP · GIFTING",
  },
};

export function GET(request: Request) {
  const requestedLocale = new URL(request.url).searchParams.get("locale");
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const copy = socialCardCopy[locale];

  return new ImageResponse(
    (
      <div
        dir={copy.direction}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          overflow: "hidden",
          color: "#ffffff",
          background: "linear-gradient(132deg, #25080c 0%, #521a25 58%, #1c1011 100%)",
          fontFamily: "serif",
          textAlign: copy.direction === "rtl" ? "right" : "left",
        }}
      >
        <div style={{ position: "absolute", inset: "0 auto 0 56%", width: 1, background: "rgba(199, 163, 109,.35)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 18, letterSpacing: 6, color: "#c7a36d" }}>ÉLORÉ PARIS</div>
          <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 16, letterSpacing: copy.direction === "rtl" ? 0 : 3, color: "rgba(255,253,252,.68)" }}>{copy.market}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ display: "flex", fontSize: locale === "ar" ? 88 : 96, lineHeight: 0.9, letterSpacing: locale === "ar" ? 0 : -4 }}>{copy.title}</div>
          <div style={{ display: "flex", maxWidth: 760, fontFamily: "sans-serif", fontSize: 28, lineHeight: 1.45, color: "rgba(255,253,252,.76)" }}>
            {copy.description}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "sans-serif", fontSize: 17, letterSpacing: copy.direction === "rtl" ? 0 : 2, color: "#ceb49f" }}>
          <span>{copy.categories}</span>
          <span>elore-paris.com</span>
        </div>
      </div>
    ),
    size,
  );
}
