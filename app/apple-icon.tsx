import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 180,
  height: 180,
};

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: 166,
            height: 166,
            borderRadius: 42,
            border: "8px solid #1f2735",
            background: "linear-gradient(160deg, #2b3444 0%, #1a2232 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 49,
              width: 80,
              height: 12,
              borderRadius: 999,
              background: "#2a3446",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 73,
              width: 98,
              height: 15,
              borderRadius: 999,
              background: "linear-gradient(160deg, #f3d77b 0%, #e4c65a 42%, #b28a11 100%)",
              boxShadow: "0 0 16px rgba(228,198,90,.8)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 102,
              width: 80,
              height: 12,
              borderRadius: 999,
              background: "#2a3446",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
