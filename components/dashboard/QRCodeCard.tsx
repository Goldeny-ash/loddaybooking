"use client";

import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { Download, Printer, Layout } from "lucide-react";

interface QRCodeCardProps {
  username: string;
  business: {
    name: string;
  };
  className?: string;
}

type SizePreset = "small" | "sticker" | "poster";
type Template = "compact" | "square" | "poster";

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
    small: 140,
    sticker: 220,
    poster: 360,
  };

  const [size, setSize] = useState<SizePreset>("small");
  const [template, setTemplate] = useState<Template>("compact");
  const [logo, setLogo] = useState<string | null>(null);

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
      w.document.write(
        `<img src="${dataUrl}" style="width:100%" />`
      );
      w.document.close();
      w.print();
      return;
    }

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${username}-qr-${template}.png`;
    link.click();
  }

  function handleLogoUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  const qrSize = sizes[size];
  const logoSize = qrSize * 0.25;

  return (
    <div
      className={`rounded-xl shadow p-4 space-y-4 ${className}`}
      style={{ backgroundColor: "var(--brand-bg-soft)" }}
    >
      <h3
        className="font-semibold"
        style={{ color: "var(--brand-primary-dark)" }}
      >
        Booking QR Posters
      </h3>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-between">

        {/* Size Selector */}
        <div className="flex gap-2 text-xs">
          {(["small", "sticker", "poster"] as SizePreset[]).map(
            (s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-2 py-1 rounded border ${
                  size === s ? "bg-white font-medium" : ""
                }`}
                style={{
                  borderColor: "var(--brand-primary)",
                }}
              >
                {s}
              </button>
            )
          )}
        </div>

        {/* Template Selector */}
        <div className="flex gap-2 text-xs">
          {(["compact", "square", "poster"] as Template[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-2 py-1 rounded border flex items-center gap-1 ${
                  template === t ? "bg-white font-medium" : ""
                }`}
                style={{
                  borderColor: "var(--brand-primary)",
                }}
              >
                <Layout size={12} />
                {t}
              </button>
            )
          )}
        </div>
      </div>

      {/* Logo Upload */}
      <div className="flex items-center gap-2 text-sm">
        <label className="cursor-pointer border px-3 py-1 rounded hover:bg-white/50">
          Upload Logo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </label>

        {logo && (
          <button
            onClick={() => setLogo(null)}
            className="text-xs text-red-500"
          >
            Remove
          </button>
        )}
      </div>

      {/* ===== POSTER PREVIEW ===== */}
      <div className="flex justify-center">
       <div

  ref={ref}

  className="bg-white text-center"

  style={{

    width: sizes[size] + 120, // frame adapts to QR size

    padding: template === "poster" ? 40 : 24,

    border: "8px solid var(--brand-primary)",

    borderRadius: 20,

    margin: "0 auto",

  }}

>
          <p className="font-bold text-lg">
            {business.name}
          </p>

          {template === "poster" && (
            <p className="text-sm mb-4">
              Scan to book instantly online
            </p>
          )}

          <div className="my-4 flex justify-center relative">
            <div className="relative">
              <QRCode
                value={trackedUrl}
                size={qrSize}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />

              {logo && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform:
                      "translate(-50%, -50%)",
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
                    src={logo}
                    alt="Logo"
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

          <p
            className="text-xs font-medium break-all"
            style={{
              color: "var(--brand-primary-dark)",
            }}
          >
            Book online: {trackedUrl}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => exportImage(false)}
          className="flex items-center gap-1 px-3 py-1 rounded text-sm text-white"
          style={{
            background: "var(--brand-primary)",
          }}
        >
          <Download size={14} /> Download
        </button>

        <button
          onClick={() => exportImage(true)}
          className="flex items-center gap-1 px-3 py-1 rounded border text-sm"
          style={{
            borderColor: "var(--brand-primary)",
          }}
        >
          <Printer size={14} /> Print
        </button>
      </div>
    </div>
  );
}