"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { Download, Printer, Sparkles } from "lucide-react";

interface QRCodeCardProps {
  username: string;
  business: {
    name: string;
  };
  className?: string;
}

type SizePreset = "small" | "sticker" | "poster";
type StylePreset =
  | "clean"
  | "bunny"
  | "phoneMockup"
  | "neon"
  | "softPeach"
  | "darkPremium"
  | "gradientFrame"
  | "stickerFun";

type QRColorPreset =
  | "classic"
  | "brand"
  | "neon"
  | "purple"
  | "dark";

export default function QRCodeCard({
  username,
  business,
  className = "",
}: QRCodeCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const trackedUrl = `${baseUrl}/b/${username}`;

  const sizes: Record<SizePreset, number> = {
    small: 160,
    sticker: 240,
    poster: 360,
  };

  const [size, setSize] = useState<SizePreset>("sticker");
  const [stylePreset, setStylePreset] =
    useState<StylePreset>("clean");
  const [qrColor, setQrColor] =
    useState<QRColorPreset>("classic");
  const [centerLogo, setCenterLogo] = useState<string | null>(null);

  async function exportImage(print = false) {
    if (!ref.current) return;

    const dataUrl = await toPng(ref.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });

    if (print) {
      const w = window.open("");
      if (!w) return;
      w.document.write(`<img src="${dataUrl}" style="width:100%" />`);
      w.document.close();
      w.print();
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${username}-lodday-qr.png`;
    link.click();
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCenterLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const qrSize = sizes[size];
  const logoSize = qrSize * 0.22;

  const qrColors: Record<QRColorPreset, { fg: string; bg: string }> = {
    classic: { fg: "#000000", bg: "#FFFFFF" },
    brand: { fg: "#15616D", bg: "#FFFFFF" },
    neon: { fg: "#00FFB2", bg: "#0F172A" },
    purple: { fg: "#6D28D9", bg: "#F3E8FF" },
    dark: { fg: "#FFFFFF", bg: "#1A1A1A" },
  };

  const containerStyles: Record<StylePreset, string> = {
    clean: "bg-white border-4 border-[#FE7F2D]",
    bunny:
      "bg-gradient-to-br from-[#FFECD1] to-[#FFF4E1] border-4 border-[#FE7F2D]",
    phoneMockup: "bg-transparent",
    neon:
      "bg-black text-white border-4 border-[#00FFB2] shadow-[0_0_40px_#00FFB2]",
    softPeach:
      "bg-[#FFF4E1] border-8 border-[#FE7F2D] shadow-lg",
    darkPremium:
      "bg-[#1A1A1A] text-white border-8 border-[#15616D]",
    gradientFrame:
      "bg-white border-[12px] border-transparent bg-clip-padding relative",
    stickerFun:
      "bg-white border-[14px] border-dashed border-[#15616D]",
  };

  return (
    <div className={`rounded-xl shadow-xl p-6 space-y-6 ${className}`}>
      <h3 className="font-semibold text-lg">Ultimate Lodday QR Studio</h3>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-between">
        <div className="flex gap-2 text-xs">
          {(["small", "sticker", "poster"] as SizePreset[]).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1 rounded border ${
                size === s ? "bg-white font-semibold" : ""
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 text-xs flex-wrap">
          {([
            "clean",
            "bunny",
            "phoneMockup",
            "neon",
            "softPeach",
            "darkPremium",
            "gradientFrame",
            "stickerFun",
          ] as StylePreset[]).map((s) => (
            <button
              key={s}
              onClick={() => setStylePreset(s)}
              className={`px-3 py-1 rounded border flex items-center gap-1 ${
                stylePreset === s ? "bg-white font-semibold" : ""
              }`}
            >
              <Sparkles size={12} /> {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 text-xs">
          {([
            "classic",
            "brand",
            "neon",
            "purple",
            "dark",
          ] as QRColorPreset[]).map((c) => (
            <button
              key={c}
              onClick={() => setQrColor(c)}
              className={`px-3 py-1 rounded border ${
                qrColor === c ? "bg-white font-semibold" : ""
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="cursor-pointer border px-3 py-1 rounded hover:bg-gray-100">
          Upload Center Logo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </label>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        {stylePreset === "phoneMockup" ? (
          <div
  ref={ref}
  className={`relative text-center rounded-3xl p-8 shadow-2xl ${containerStyles[stylePreset]}`}
  style={{ width: sizes[size] + 260 }}
>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-3 bg-gray-700 rounded-full" />
            <div className="bg-white rounded-3xl p-6 h-full flex flex-col items-center justify-center">
              <Image
                src="/lodday1.png"
                alt="Lodday"
                width={160}
                height={48}
                className="h-12 w-auto mb-6"
              />
              <h2 className="font-bold mb-4 text-center">
                {business.name}
              </h2>
              <QRCode
                value={trackedUrl}
                size={220}
                bgColor={qrColors[qrColor].bg}
                fgColor={qrColors[qrColor].fg}
              />
            </div>
          </div>
        ) : (
          <div
  ref={ref}
  className={`relative text-center rounded-3xl p-8 shadow-2xl ${containerStyles[stylePreset]}`}
  style={{ width: sizes[size] + 260 }}
>
  {/* BIG BRAND HEADER */}
 {/* BRAND HEADER */}
{/* FULL WIDTH BRAND HEADER */}
<div className="flex justify-center mb-6">
  <img
    src="/lodday1.png"
    alt="Lodday Logo"
    className="h-[90px] w-auto object-contain"
    style={{
      imageRendering: "crisp-edges"
    }}
  />
</div>

  <h2 className="text-2xl font-bold mb-4">
    {business.name}
  </h2>

  {/* QR SECTION */}
  <div className="flex justify-center">
    <div className="relative bg-white p-6 rounded-2xl shadow-xl">
      <QRCode
        value={trackedUrl}
        size={qrSize}
        bgColor={qrColors[qrColor].bg}
        fgColor={qrColors[qrColor].fg}
      />

      {centerLogo && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: logoSize,
            height: logoSize,
            backgroundColor: "#ffffff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
          }}
        >
          <img
            src={centerLogo}
            alt="Center Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: "50%",
            }}
          />
        </div>
      )}
    </div>
  </div>

  <p className="text-sm mt-8 font-medium">
    Scan to book instantly
  </p>

  <p className="text-xs break-all mt-2 text-gray-500">
    {trackedUrl}
  </p>
</div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => exportImage(false)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm text-white bg-[#15616D]"
        >
          <Download size={14} /> Download
        </button>

        <button
          onClick={() => exportImage(true)}
          className="flex items-center gap-2 px-4 py-2 rounded border text-sm border-[#15616D]"
        >
          <Printer size={14} /> Print
        </button>
      </div>
    </div>
  );
}
