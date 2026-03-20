"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp } from "lucide-react";
import ThemedPopup from "@/components/ThemedPopup";

export default function AffiliatesHomePage() {
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupVariant, setPopupVariant] = useState<"success" | "error">("success");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    idDocument: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const showPopup = (message: string, variant: "success" | "error" = "error") => {
    setPopupVariant(variant);
    setPopupMessage(message);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      if (form.idDocument) payload.append("idDocument", form.idDocument);

      const response = await fetch("/api/affiliates/apply", {
        method: "POST",
        body: payload,
      });

      const json = await response.json();
      if (!response.ok) {
        showPopup(json?.error || "Could not submit your application.");
        return;
      }

      setForm({ name: "", email: "", phone: "", idDocument: null });
      setPreviewUrl(null);
      showPopup(json?.message || "Application received. You will be notified after review.", "success");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setForm((current) => ({ ...current, idDocument: null }));
      setPreviewUrl(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      showPopup("ID document must be a PNG, JPG, WEBP image, or PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showPopup("ID document must be smaller than 5MB.");
      return;
    }

    setForm((current) => ({ ...current, idDocument: file }));

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#101828]">
      <ThemedPopup
        message={popupMessage}
        variant={popupVariant}
        onClose={() => setPopupMessage(null)}
      />

      <section className="px-4 pb-14 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2.5rem] bg-[linear-gradient(135deg,#111827_0%,#1f2937_60%,#0f5a66_100%)] px-6 py-10 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:px-10 sm:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
              Lodday Affiliates
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
              Earn money by referring businesses to Lodday
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/78">
              Get paid for every successful referral. Affiliates earn KES 100 when the referred
              business pays for the first month, then KES 150 on the second successful
              subscription only.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#apply"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#111827]"
              >
                Apply Now
              </a>
              <Link
                href="/affiliates/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
              >
                Affiliate Dashboard
              </Link>
            </div>
          </div>

          <section className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
              How it works
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-4">
              {[
                "Apply to become an affiliate",
                "Get approved by Lodday",
                "Receive your referral code and access code",
                "Earn commissions paid via M-Pesa",
              ].map((item, index) => (
                <article key={item} className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FE7F2D]">
                    Step {index + 1}
                  </p>
                  <p className="mt-4 text-base leading-7 text-[#111827]">{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
                Requirements
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                <li>Enter your full name exactly as it appears on your national ID.</li>
                <li>Use a valid and unique email address.</li>
                <li>Use a valid Kenyan M-Pesa phone number.</li>
                <li>Upload a clear image or PDF of your ID.</li>
                <li>Only one affiliate account is allowed per person.</li>
                <li>Admin may pause a code after review if it brings in no new businesses within two months.</li>
              </ul>
            </div>

            <form
              id="apply"
              onSubmit={onSubmit}
              className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#78290F]/60">
                Apply
              </p>
              <h2 className="mt-3 font-serif text-3xl text-[#111827]">Affiliate application</h2>
              <div className="mt-6 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Enter your name exactly as it appears on your ID"
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">Phone Number (M-Pesa)</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="07... or 254..."
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">National ID Upload</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-gray-300 bg-[#fafafa] px-6 py-8 text-center transition hover:border-black">
                    <FileUp size={28} className="text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-[#111827]">Upload your ID</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP or PDF, smaller than 5MB</p>
                    <input
                      required
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {form.idDocument ? (
                    <div className="mt-3 rounded-2xl border border-black/10 bg-[#f7f4ef] px-4 py-3 text-sm text-slate-600">
                      Selected file: <span className="font-medium text-[#111827]">{form.idDocument.name}</span>
                    </div>
                  ) : null}
                  {previewUrl ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white p-2">
                      <img src={previewUrl} alt="Selected ID preview" className="max-h-48 w-full object-contain" />
                    </div>
                  ) : null}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#111827] px-5 py-3 text-sm font-semibold text-white"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
