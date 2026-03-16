"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  LifeBuoy,
  MonitorPlay,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CurvedSection from "@/components/home/CurvedSection";
import FloatingShape from "@/components/FloatingShape";
import Footer from "@/components/Footer";

type Tutorial = {
  id: string;
  title: string;
  summary: string;
  category: string;
  pdfPath: string;
  totalPages: number;
};

const colors = {
  primary: "#15616D",
  secondary: "#78290F",
  accent: "#FE7F2D",
  lightPeach: "#FFECD1",
  softPeach: "#FFF4E1",
  seamountLight: "#C2E0E0",
  darkText: "#001524",
  white: "#FFFFFF",
};

const tutorials: Tutorial[] = [
  {
    id: "account-setup",
    title: "Account Setup Walkthrough",
    summary: "A step-by-step guide to setting up your Lodday account and getting your booking workspace ready.",
    category: "Getting Started",
    pdfPath: "/lodday-account-setup.pdf",
    totalPages: 11,
  },
];

function PdfAccordionItem({
  tutorial,
  isOpen,
  onToggle,
}: {
  tutorial: Tutorial;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [page, setPage] = useState(1);

  const viewerSrc = useMemo(
    () => `${tutorial.pdfPath}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`,
    [page, tutorial.pdfPath]
  );

  const goPrev = () => setPage((current) => Math.max(1, current - 1));
  const goNext = () => setPage((current) => Math.min(tutorial.totalPages, current + 1));

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_18px_60px_rgba(0,21,36,0.08)] backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <div>
          <div className="mb-2 inline-flex rounded-full bg-[#FFECD1] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#78290F]">
            {tutorial.category}
          </div>
          <h2 className="text-xl font-semibold text-[#001524] sm:text-2xl">{tutorial.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[#4B5563] sm:text-base">{tutorial.summary}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#15616D] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div className="border-t border-[#F0E3D3] px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-[24px] bg-[#FFF8F1] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#001524]">Tutorial viewer</p>
                  <p className="text-sm text-[#5B6470]">
                    Page {page} of {tutorial.totalPages}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={page === 1}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#15616D]/20 bg-white text-[#15616D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={tutorial.totalPages}
                    value={page}
                    onChange={(event) => setPage(Number(event.target.value))}
                    className="h-2 w-40 accent-[#FE7F2D] sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={page === tutorial.totalPages}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#15616D]/20 bg-white text-[#15616D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-[#EADBCB] bg-white shadow-[0_18px_60px_rgba(0,21,36,0.06)]">
                <iframe
                  key={viewerSrc}
                  src={viewerSrc}
                  title={tutorial.title}
                  className="h-[70vh] min-h-[540px] w-full bg-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] bg-[linear-gradient(140deg,#001524,#15616D_58%,#2A8F9D)] p-6 text-white shadow-[0_24px_70px_rgba(0,21,36,0.18)]">
                
               

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={`${tutorial.pdfPath}#page=${page}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FE7F2D] px-5 py-3 font-medium text-white transition-transform hover:scale-[1.02]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Browser
                  </Link>
                  <Link
                    href={tutorial.pdfPath}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 font-medium text-white transition-transform hover:scale-[1.02]"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function HelpPage() {
  const [openTutorialId, setOpenTutorialId] = useState<string>(tutorials[0]?.id ?? "");

  return (
    <main className="relative pt-28">
      <CurvedSection
        bg="linear-gradient(120deg, #FFECD1 0%, #FFF4E1 100%)"
        style={{ paddingBottom: "96px", paddingLeft: "1rem", paddingRight: "1rem" }}
      >
        <>
          <Navbar />
          <FloatingShape size={120} x={10} y={5} color={colors.accent} opacity={0.08} />
          <FloatingShape size={88} x={78} y={18} color={colors.primary} opacity={0.06} />
          <FloatingShape size={64} x={52} y={70} color={colors.secondary} opacity={0.08} />

          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-12 md:flex-row md:items-center md:justify-between">
            <div className="w-full text-center md:w-1/2 md:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#15616D]/15 bg-white/60 px-4 py-2 text-sm text-[#15616D]">
                <LifeBuoy className="h-4 w-4" />
                Help Center
              </div>
              <h1 className="font-serif text-4xl leading-tight text-[#001524] md:text-6xl">
                Learn Lodday with guided tutorials.
              </h1>
              

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="#tutorials"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FE7F2D] px-8 py-4 text-white shadow-lg transition-transform hover:scale-105"
                >
                  <BookOpen className="h-4 w-4" />
                  Browse Tutorials
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#15616D]/20 bg-white/70 px-8 py-4 text-[#15616D] shadow-sm transition-transform hover:scale-105"
                >
                  <MonitorPlay className="h-4 w-4" />
                  View Dashboard
                </Link>
              </div>
            </div>

            
          </div>
        </>
      </CurvedSection>

      <CurvedSection bg={colors.softPeach}>
        <div id="tutorials" className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-serif text-4xl text-[#001524]">Tutorial Library</h2>
           
          </div>

          <div className="space-y-5">
            {tutorials.map((tutorial) => (
              <PdfAccordionItem
                key={tutorial.id}
                tutorial={tutorial}
                isOpen={openTutorialId === tutorial.id}
                onToggle={() =>
                  setOpenTutorialId((current) => (current === tutorial.id ? "" : tutorial.id))
                }
              />
            ))}
          </div>
        </div>
      </CurvedSection>

      <Footer />
    </main>
  );
}
