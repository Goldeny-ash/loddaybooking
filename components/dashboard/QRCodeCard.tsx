"use client";

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
        <div
          ref={ref}
          className={`relative overflow-hidden text-center shadow-2xl ${containerStyles[stylePreset]}`}
          style={{ width: sizes[size] + 260, maxWidth: "100%", borderRadius: 36 }}
        >
          <div
            className="relative min-h-[400px] overflow-hidden bg-contain bg-center bg-no-repeat"
            style={{
              backgroundColor: "#8b2b17",
              backgroundImage: "url('/lodday1.png')",
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(131,28,12,0.72)_0%,rgba(184,53,21,0.58)_45%,rgba(116,26,18,0.72)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_70%)]" />

            <div className="relative z-10 flex h-full flex-col items-center px-8 pb-28 pt-10 text-white">
              <p className="max-w-[18ch] text-center text-[clamp(18px,2.2vw,28px)] font-medium uppercase leading-tight tracking-[0.12em] break-words">
                {business.name}
              </p>

              <h2 className="mt-2 text-[clamp(64px,8vw,112px)] font-black uppercase tracking-[0.08em] leading-none">
                Scan
              </h2>

              <p className="mt-4 max-w-[14ch] text-center text-[clamp(22px,2.6vw,34px)] font-extrabold uppercase leading-tight">
                to view our services and book
              </p>
            </div>

            <div className="absolute -bottom-16 left-1/2 h-40 w-[140%] -translate-x-1/2 rounded-[50%] bg-white" />
          </div>

          <div className="relative z-10 -mt-6 px-8 pb-10">
            <div className="mx-auto flex justify-center">
              <div className="relative rounded-[28px] border-4 border-[#C84E22] bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
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

            <p className="mt-8 text-[clamp(20px,2.4vw,34px)] font-extrabold uppercase leading-tight text-[#9A381A]">
              we hope you have a good time with us!
            </p>

            <p className="mt-5 text-sm font-medium text-[#A65535]">
              {trackedUrl}
            </p>
          </div>
        </div>
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
