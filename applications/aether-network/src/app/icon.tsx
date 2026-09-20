import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#B8E986",
          borderRadius: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#12210B",
          fontSize: 22,
          fontFamily: "serif",
        }}
      >
        æ
      </div>
    ),
    size,
  );
}
