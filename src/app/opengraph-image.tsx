import { ImageResponse } from "next/og";

export const alt = "Cozmateks | Saudi premium beauty storefront";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #fbf6f1 0%, #f7f1ea 45%, #efe4dd 100%)",
          color: "#2b1c28",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "auto auto -90px -40px",
            width: 340,
            height: 340,
            borderRadius: 999,
            background: "rgba(216, 181, 174, 0.34)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "-80px -40px auto auto",
            width: 320,
            height: 320,
            borderRadius: 999,
            background: "rgba(151, 160, 149, 0.24)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "58px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 24,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                  color: "#7a5f6c",
                }}
              >
                <span>Saudi premium beauty storefront</span>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 82,
                  lineHeight: 0.94,
                  fontWeight: 700,
                  letterSpacing: -3,
                }}
              >
                Cozmateks
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  lineHeight: 1.35,
                  color: "#4c4047",
                  maxWidth: 860,
                }}
              >
                Curated skincare, makeup, routines, trust-first commerce, and
                Arabic-first editorial discovery built for the Saudi market.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minWidth: 220,
                padding: "24px 22px",
                borderRadius: 28,
                background: "rgba(43, 28, 40, 0.92)",
                color: "#fff8f3",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "rgba(247, 241, 234, 0.72)",
                }}
              >
                Live foundations
              </div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
                Skincare
              </div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
                Makeup
              </div>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>
                Trust + Journal
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {["Concern-led", "Ingredient-led", "Routine-led", "SEO-ready"].map(
              (tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    minHeight: 52,
                    alignItems: "center",
                    padding: "0 20px",
                    borderRadius: 999,
                    border: "1px solid rgba(43, 28, 40, 0.1)",
                    background: "rgba(255, 255, 255, 0.62)",
                    fontSize: 24,
                    color: "#2b1c28",
                  }}
                >
                  {tag}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
