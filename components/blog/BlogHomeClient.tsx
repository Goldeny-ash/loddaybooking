"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

function blogHref(basePath = "", slug?: string) {
  const normalizedBase = basePath || "/blg";
  return slug ? `${normalizedBase}/${slug}` : normalizedBase;
}

type BlogPostItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  categoryName?: string;
  tags?: string[];
  featured?: boolean;
  readTimeMinutes: number;
  authorName?: string;
};

function chunkPosts<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function formatTagCloud(posts: BlogPostItem[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags || []) {
      const clean = String(tag || "").trim();
      if (!clean) continue;
      counts.set(clean, (counts.get(clean) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([tag]) => tag);
}

export default function BlogHomeClient({
  basePath,
  featuredPosts,
  latestPosts,
  initialSearch = "",
}: {
  basePath: string;
  featuredPosts: BlogPostItem[];
  latestPosts: BlogPostItem[];
  initialSearch?: string;
}) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobilePage, setMobilePage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchValue, setSearchValue] = useState(initialSearch);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        latestPosts
          .map((post) => post.categoryName || "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    return ["All Categories", ...values];
  }, [latestPosts]);

  const filteredPosts = useMemo(() => {
    return latestPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All Categories" || (post.categoryName || "") === selectedCategory;
      const haystack = `${post.title} ${post.excerpt} ${(post.tags || []).join(" ")}`.toLowerCase();
      const matchesSearch = !searchValue.trim() || haystack.includes(searchValue.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [latestPosts, searchValue, selectedCategory]);

  const desktopHeroPosts = useMemo(() => {
    const source = featuredPosts.length ? featuredPosts : latestPosts.slice(0, 8);
    if (source.length <= 4) return source;
    return source.slice(heroIndex, heroIndex + 4).length === 4
      ? source.slice(heroIndex, heroIndex + 4)
      : [...source.slice(heroIndex), ...source.slice(0, 4 - source.slice(heroIndex).length)];
  }, [featuredPosts, heroIndex, latestPosts]);

  const mobileHeroPosts = useMemo(() => {
    const source = featuredPosts.length ? featuredPosts : latestPosts.slice(0, 6);
    if (!source.length) return [];
    return [source[heroIndex % source.length]];
  }, [featuredPosts, heroIndex, latestPosts]);

  const mobilePages = useMemo(() => chunkPosts(filteredPosts, 4), [filteredPosts]);
  const currentMobilePosts = mobilePages[mobilePage] || [];
  const currentDesktopPosts = filteredPosts;
  const tagCloud = useMemo(() => formatTagCloud(filteredPosts.length ? filteredPosts : latestPosts), [filteredPosts, latestPosts]);

  useEffect(() => {
    setMobilePage(0);
  }, [selectedCategory, searchValue]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => {
        const sourceLength = (featuredPosts.length ? featuredPosts : latestPosts.slice(0, 6)).length;
        if (!sourceLength) return 0;
        return (current + 1) % sourceLength;
      });
    }, 25000);

    return () => window.clearInterval(timer);
  }, [featuredPosts, latestPosts]);

  const handleDesktopPrev = () => {
    const sourceLength = (featuredPosts.length ? featuredPosts : latestPosts.slice(0, 8)).length;
    if (sourceLength <= 4) return;
    setHeroIndex((current) => (current - 1 + sourceLength) % sourceLength);
  };

  const handleDesktopNext = () => {
    const sourceLength = (featuredPosts.length ? featuredPosts : latestPosts.slice(0, 8)).length;
    if (sourceLength <= 4) return;
    setHeroIndex((current) => (current + 1) % sourceLength);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchValue(searchValue.trim());
  };

  const goToNextMobilePage = () => {
    if (!mobilePages.length) return;
    setMobilePage((current) => (current + 1) % mobilePages.length);
    document.getElementById("blog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="bg-[#15616D] pb-10">
      <section className="px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[2rem] bg-[linear-gradient(180deg,#1b717e_0%,#15616D_100%)] p-4 shadow-[0_24px_80px_rgba(21,97,109,0.35)] sm:p-6">
            <div className="hidden gap-4 md:grid md:grid-cols-4">
              {desktopHeroPosts.map((post, index) => (
                <Link
                  key={`${post._id}-${index}`}
                  href={blogHref(basePath, post.slug)}
                  className={`group relative overflow-hidden rounded-[1.6rem] border border-white/10 shadow-[0_18px_40px_rgba(26,26,26,0.22)] ${
                    index === 0 ? "md:col-span-1" : ""
                  }`}
                >
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-[280px] w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-[280px] w-full bg-[linear-gradient(135deg,#FFECD1_0%,#C2E0E0_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_8%,rgba(26,26,26,0.82)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">
                      {post.categoryName || "Blog"}
                    </p>
                    <h2 className="mt-2 line-clamp-3 text-lg font-black leading-snug">{post.title}</h2>
                    <span className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      Read More
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="relative md:hidden">
              {mobileHeroPosts.map((post) => (
                <Link
                  key={post._id}
                  href={blogHref(basePath, post.slug)}
                  className="group relative block overflow-hidden rounded-[1.6rem] border border-white/10 shadow-[0_18px_40px_rgba(26,26,26,0.22)]"
                >
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-[280px] w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-[280px] w-full bg-[linear-gradient(135deg,#FFECD1_0%,#C2E0E0_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_10%,rgba(26,26,26,0.84)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white transition duration-300 animate-in fade-in">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/75">
                      {post.categoryName || "Blog"}
                    </p>
                    <h1 className="mt-2 line-clamp-3 text-2xl font-black leading-tight">{post.title}</h1>
                    <span className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      Read More
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 hidden items-center justify-between md:flex">
              <button
                type="button"
                onClick={handleDesktopPrev}
                className="inline-flex items-center gap-2 rounded-full bg-[#FE7F2D] px-4 py-2 text-sm font-black text-white shadow-[0_12px_30px_rgba(254,127,45,0.35)]"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={handleDesktopNext}
                className="inline-flex items-center gap-2 rounded-full bg-[#FE7F2D] px-4 py-2 text-sm font-black text-white shadow-[0_12px_30px_rgba(254,127,45,0.35)]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#FE7F2D] shadow-[0_24px_80px_rgba(26,26,26,0.18)]">
          <div className="border-b border-black/10 px-4 py-4 sm:px-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1A1A1A] outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="flex flex-1 items-center rounded-full bg-white px-4 py-3 shadow-inner">
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search posts..."
                  className="w-full bg-transparent text-sm text-[#1A1A1A] outline-none placeholder:text-[#7d7d7d]"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#15616D] text-white"
                  aria-label="Search posts"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div id="blog-grid" className="bg-[#FFF4E1] px-4 py-5 sm:px-6 sm:py-6">
            <div className="hidden gap-5 sm:grid sm:grid-cols-2 xl:grid-cols-3">
              {currentDesktopPosts.map((post, index) => (
                <Link
                  key={post._id}
                  href={blogHref(basePath, post.slug)}
                  className="group rounded-[1.6rem] bg-white p-3 shadow-[0_16px_40px_rgba(30,41,89,0.1)] transition hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden rounded-[1.25rem]">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="h-48 w-full"
                        style={{
                          background:
                            index % 3 === 0
                              ? "linear-gradient(135deg,#C2E0E0 0%,#FFECD1 100%)"
                              : index % 3 === 1
                                ? "linear-gradient(135deg,#FFECD1 0%,#FFF4E1 100%)"
                                : "linear-gradient(135deg,#15616D 0%,#C2E0E0 100%)",
                        }}
                      />
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-[#15616D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                      {post.categoryName || "Design"}
                    </div>
                    {post.featured ? (
                      <div className="absolute right-3 top-3 rounded-full bg-[#FE7F2D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                        Popular
                      </div>
                    ) : null}
                  </div>

                  <div className="px-2 pb-2 pt-4 text-[#1A1A1A]">
                    <h3 className="line-clamp-2 text-lg font-black leading-snug">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6a625b]">{post.excerpt}</p>

                    <div className="mt-5 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#78290F]">
                      <span>{post.readTimeMinutes} min read</span>
                      <span>{post.authorName || "Lodday Team"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="space-y-5 sm:hidden">
              {currentMobilePosts.map((post, index) => (
                <Link
                  key={post._id}
                  href={blogHref(basePath, post.slug)}
                  className="group block rounded-[1.6rem] bg-white p-3 shadow-[0_16px_40px_rgba(30,41,89,0.1)]"
                >
                  <div className="relative overflow-hidden rounded-[1.25rem]">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="h-48 w-full"
                        style={{
                          background:
                            index % 2 === 0
                              ? "linear-gradient(135deg,#C2E0E0 0%,#FFECD1 100%)"
                              : "linear-gradient(135deg,#FFECD1 0%,#FFF4E1 100%)",
                        }}
                      />
                    )}
                    <div className="absolute left-3 top-3 rounded-full bg-[#15616D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                      {post.categoryName || "Blog"}
                    </div>
                  </div>

                  <div className="px-2 pb-2 pt-4 text-[#1A1A1A]">
                    <h3 className="line-clamp-2 text-lg font-black leading-snug">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#6a625b]">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={goToNextMobilePage}
                className="rounded-full bg-[#15616D] px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-white sm:pointer-events-none"
              >
                Page {mobilePages.length ? mobilePage + 1 : 1} of {mobilePages.length || 1}
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById("whatsapp-channel")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="rounded-full border border-[#C2E0E0] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#15616D]"
              >
                Explore
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#78290F_0%,#15616D_100%)] shadow-[0_24px_80px_rgba(26,26,26,0.22)]">
          <div className="relative px-6 py-10 text-center sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_55%)]" />
            <div id="whatsapp-channel" className="relative z-10 mx-auto max-w-3xl">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-white/75">
                Stay Updated
              </span>
              <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                Join my WhatsApp channel
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Get blog updates, business tips, and practical booking-growth ideas straight to your phone.
              </p>

              <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href="https://wa.me/"
                  className="inline-flex items-center justify-center rounded-full bg-[#FE7F2D] px-6 py-3 text-sm font-black text-white shadow-[0_14px_35px_rgba(254,127,45,0.35)]"
                >
                  Join WhatsApp
                </a>
                <a
                  href="https://booking.lodday.com/setup?mode=trial"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-black text-white"
                >
                  Start with Lodday
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#FFECD1] px-6 py-8 text-[#1A1A1A] shadow-[0_24px_80px_rgba(26,26,26,0.16)] sm:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#78290F]">
                Featured posts
              </p>
              <div className="mt-5 space-y-4">
                {latestPosts.slice(0, 3).map((post) => (
                  <Link key={post._id} href={blogHref(basePath, post.slug)} className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#C2E0E0]">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div>
                      <p className="line-clamp-2 text-sm font-bold leading-6 text-[#1A1A1A]">{post.title}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#78290F]">
                        {post.readTimeMinutes} min read
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#78290F]">
                Tag cloud
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {tagCloud.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#15616D] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#78290F]">
                Terms and conditions
              </p>
              <div className="mt-5 space-y-3 text-sm leading-7 text-[#5f5144]">
                <p>All blog resources are shared for inspiration, education, and service-business growth support.</p>
                <p>Always review tools, templates, and design references before using them in client work.</p>
                <p>By joining the channel, you agree to receive Lodday blog updates and related business-growth messages.</p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs font-black uppercase tracking-[0.2em] text-[#15616D]">
                  <a href="https://booking.lodday.com/terms">Terms</a>
                  <a href="https://booking.lodday.com/privacy">Privacy</a>
                  <a href="https://booking.lodday.com/subscription">Subscription</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#C2E0E0] pt-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#15616D]">
              Lodday Blog
            </p>
            <p className="mt-2 text-sm text-[#5f5144]">www.booking.lodday.com</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
