import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0B0F1A 0%, #111827 45%, #0B1220 100%)",
          color: "#FFFFFF",
          letterSpacing: "-0.02em",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#22C55E",
                boxShadow: "0 0 0 10px rgba(34, 197, 94, 0.12)",
              }}
            />
            <div style={{ fontSize: 28, opacity: 0.9 }}>247ROI</div>
          </div>

          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
            Revenue That Runs 24/7
          </div>

          <div style={{ fontSize: 30, opacity: 0.88, maxWidth: 980, lineHeight: 1.3 }}>
            Capture leads, book appointments, and follow up automatically — measurable ROI, even
            after hours.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            opacity: 0.85,
          }}
        >
          <div style={{ fontSize: 24 }}>get247roi.com</div>
          <div style={{ fontSize: 22 }}>AI Reception • Lead Capture • Follow-up</div>
        </div>
      </div>
    ),
    size,
  );
}

