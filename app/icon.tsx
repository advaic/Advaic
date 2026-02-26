import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 512,
  height: 512,
};

export default function Icon() {
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
            width: 464,
            height: 464,
            borderRadius: 118,
            border: "18px solid #1f2735",
            background: "linear-gradient(160deg, #2b3444 0%, #1a2232 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 28px 48px rgba(11,15,23,.28)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 135,
              width: 250,
              height: 36,
              borderRadius: 22,
              background: "#2a3446",
              border: "4px solid #121823",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 212,
              width: 308,
              height: 46,
              borderRadius: 24,
              background: "linear-gradient(160deg, #f3d77b 0%, #e4c65a 42%, #b28a11 100%)",
              border: "4px solid #b89225",
              boxShadow: "0 0 42px rgba(228,198,90,.75)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 298,
              width: 250,
              height: 36,
              borderRadius: 22,
              background: "#2a3446",
              border: "4px solid #121823",
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
