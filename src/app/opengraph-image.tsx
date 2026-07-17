import { ImageResponse } from "next/og";

export const alt = "ÉLORÉ PARIS | Beauty, composed with intention.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
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
          background: "linear-gradient(132deg, #3b0f1a 0%, #611f2e 58%, #2a0d14 100%)",
          fontFamily: "serif",
        }}
      >
        <div style={{ position: "absolute", inset: "0 auto 0 56%", width: 1, background: "rgba(212, 175, 55,.35)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 18, letterSpacing: 6, color: "#d4af37" }}>ÉLORÉ PARIS</div>
          <div style={{ display: "flex", fontFamily: "sans-serif", fontSize: 16, letterSpacing: 3, color: "rgba(255,253,252,.68)" }}>SAUDI ARABIA</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ display: "flex", fontSize: 96, lineHeight: 0.9, letterSpacing: -4 }}>Beauty, composed with intention.</div>
          <div style={{ display: "flex", maxWidth: 760, fontFamily: "sans-serif", fontSize: 28, lineHeight: 1.45, color: "rgba(255,253,252,.76)" }}>
            Parisian ritual. Saudi relevance. Clearer texture, shade and routine guidance before you choose.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "sans-serif", fontSize: 17, letterSpacing: 2, color: "#e8c8bd" }}>
          <span>SKINCARE · MAKEUP · GIFTING</span>
          <span>elore-paris.com</span>
        </div>
      </div>
    ),
    size,
  );
}
