"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ImageUpload from "@/components/ImageUpload";
import type { BlogCategoryRecord, BlogPostRecord } from "@/lib/blog";
import { sanitizeHtml } from "@/lib/htmlSanitizer";

type Props = {
  mode: "create" | "edit";
  categories: BlogCategoryRecord[];
  posts: BlogPostRecord[];
  initialPost?: BlogPostRecord | null;
};

type InternalLinkState = {
  postId: string;
  title: string;
  slug: string;
};

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (item: number) => String(item).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const contentPreviewClasses =
  "mt-6 max-w-none [&_a]:text-[#15616D] [&_a]:underline [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-l-[#15616D] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_em]:italic [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:font-serif [&_h1]:text-4xl [&_h1]:text-slate-900 [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:text-slate-900 [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:text-slate-900 [&_img]:my-6 [&_img]:rounded-[1.5rem] [&_img]:shadow-sm [&_li]:mb-2 [&_li]:text-slate-700 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-8 [&_p]:text-slate-700 [&_strong]:font-semibold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6";

export default function BlogPostEditor({ mode, categories, posts, initialPost }: Props) {
  const router = useRouter();
  const draftStorageKey = mode === "create" ? "admin.blogPostEditor.createDraft" : `admin.blogPostEditor.editDraft.${initialPost?._id || "unknown"}`;
  const hasRestoredDraft = useRef(false);
  const [draftReady, setDraftReady] = useState(false);
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [contentFormat, setContentFormat] = useState<"markdown" | "html">(initialPost?.contentFormat || "markdown");
  const [content, setContent] = useState(initialPost?.content || "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [gallery, setGallery] = useState<string[]>(initialPost?.gallery || []);
  const [status, setStatus] = useState<BlogPostRecord["status"]>(initialPost?.status || "draft");
  const [featured, setFeatured] = useState(Boolean(initialPost?.featured));
  const [trending, setTrending] = useState(Boolean(initialPost?.trending));
  const [audience, setAudience] = useState<BlogPostRecord["audience"]>(initialPost?.audience || "all");
  const [categoryId, setCategoryId] = useState(initialPost?.categoryId || "");
  const [tags, setTags] = useState((initialPost?.tags || []).join(", "));
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription || "");
  const [authorName, setAuthorName] = useState(initialPost?.authorName || "Lodday Team");
  const [publishedAt, setPublishedAt] = useState(toDateTimeInput(initialPost?.publishedAt));
  const [scheduledFor, setScheduledFor] = useState(toDateTimeInput(initialPost?.scheduledFor));
  const [ctaTitle, setCtaTitle] = useState(initialPost?.cta.title || "");
  const [ctaDescription, setCtaDescription] = useState(initialPost?.cta.description || "");
  const [ctaLabel, setCtaLabel] = useState(initialPost?.cta.label || "");
  const [ctaHref, setCtaHref] = useState(initialPost?.cta.href || "");
  const [popupEnabled, setPopupEnabled] = useState(Boolean(initialPost?.popup.enabled));
  const [popupHeadline, setPopupHeadline] = useState(initialPost?.popup.headline || "");
  const [popupSubheadline, setPopupSubheadline] = useState(initialPost?.popup.subheadline || "");
  const [popupLabel, setPopupLabel] = useState(initialPost?.popup.label || "");
  const [popupHref, setPopupHref] = useState(initialPost?.popup.href || "");
  const [popupImage, setPopupImage] = useState(initialPost?.popup.image || "");
  const [popupTrigger, setPopupTrigger] = useState<"scroll" | "bottom">(initialPost?.popup.trigger || "scroll");
  const [internalLinks, setInternalLinks] = useState<InternalLinkState[]>(initialPost?.internalLinks || []);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const availableLinks = useMemo(() => {
    return posts
      .filter((item) => item._id !== initialPost?._id)
      .filter((item) => {
        if (!categoryId) return true;
        return item.categoryId === categoryId || item.audience === audience || item.audience === "all";
      })
      .slice(0, 10);
  }, [posts, initialPost?._id, categoryId, audience]);

  const previewHtml = useMemo(() => sanitizeHtml(content), [content]);

  useEffect(() => {
    if (hasRestoredDraft.current || typeof window === "undefined") {
      return;
    }

    hasRestoredDraft.current = true;
    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) {
      setDraftReady(true);
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as Partial<{
        title: string;
        excerpt: string;
        contentFormat: "markdown" | "html";
        content: string;
        coverImage: string;
        gallery: string[];
        status: BlogPostRecord["status"];
        featured: boolean;
        trending: boolean;
        audience: BlogPostRecord["audience"];
        categoryId: string;
        tags: string;
        seoTitle: string;
        seoDescription: string;
        authorName: string;
        publishedAt: string;
        scheduledFor: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaLabel: string;
        ctaHref: string;
        popupEnabled: boolean;
        popupHeadline: string;
        popupSubheadline: string;
        popupLabel: string;
        popupHref: string;
        popupImage: string;
        popupTrigger: "scroll" | "bottom";
        internalLinks: InternalLinkState[];
      }>;

      setTitle(typeof draft.title === "string" ? draft.title : initialPost?.title || "");
      setExcerpt(typeof draft.excerpt === "string" ? draft.excerpt : initialPost?.excerpt || "");
      setContentFormat(draft.contentFormat === "html" ? "html" : draft.contentFormat === "markdown" ? "markdown" : initialPost?.contentFormat || "markdown");
      setContent(typeof draft.content === "string" ? draft.content : initialPost?.content || "");
      setCoverImage(typeof draft.coverImage === "string" ? draft.coverImage : initialPost?.coverImage || "");
      setGallery(Array.isArray(draft.gallery) ? draft.gallery : initialPost?.gallery || []);
      setStatus(draft.status || initialPost?.status || "draft");
      setFeatured(typeof draft.featured === "boolean" ? draft.featured : Boolean(initialPost?.featured));
      setTrending(typeof draft.trending === "boolean" ? draft.trending : Boolean(initialPost?.trending));
      setAudience(draft.audience || initialPost?.audience || "all");
      setCategoryId(typeof draft.categoryId === "string" ? draft.categoryId : initialPost?.categoryId || "");
      setTags(typeof draft.tags === "string" ? draft.tags : (initialPost?.tags || []).join(", "));
      setSeoTitle(typeof draft.seoTitle === "string" ? draft.seoTitle : initialPost?.seoTitle || "");
      setSeoDescription(typeof draft.seoDescription === "string" ? draft.seoDescription : initialPost?.seoDescription || "");
      setAuthorName(typeof draft.authorName === "string" ? draft.authorName : initialPost?.authorName || "Lodday Team");
      setPublishedAt(typeof draft.publishedAt === "string" ? draft.publishedAt : toDateTimeInput(initialPost?.publishedAt));
      setScheduledFor(typeof draft.scheduledFor === "string" ? draft.scheduledFor : toDateTimeInput(initialPost?.scheduledFor));
      setCtaTitle(typeof draft.ctaTitle === "string" ? draft.ctaTitle : initialPost?.cta.title || "");
      setCtaDescription(typeof draft.ctaDescription === "string" ? draft.ctaDescription : initialPost?.cta.description || "");
      setCtaLabel(typeof draft.ctaLabel === "string" ? draft.ctaLabel : initialPost?.cta.label || "");
      setCtaHref(typeof draft.ctaHref === "string" ? draft.ctaHref : initialPost?.cta.href || "");
      setPopupEnabled(typeof draft.popupEnabled === "boolean" ? draft.popupEnabled : Boolean(initialPost?.popup.enabled));
      setPopupHeadline(typeof draft.popupHeadline === "string" ? draft.popupHeadline : initialPost?.popup.headline || "");
      setPopupSubheadline(typeof draft.popupSubheadline === "string" ? draft.popupSubheadline : initialPost?.popup.subheadline || "");
      setPopupLabel(typeof draft.popupLabel === "string" ? draft.popupLabel : initialPost?.popup.label || "");
      setPopupHref(typeof draft.popupHref === "string" ? draft.popupHref : initialPost?.popup.href || "");
      setPopupImage(typeof draft.popupImage === "string" ? draft.popupImage : initialPost?.popup.image || "");
      setPopupTrigger(draft.popupTrigger === "bottom" ? "bottom" : draft.popupTrigger === "scroll" ? "scroll" : initialPost?.popup.trigger || "scroll");
      setInternalLinks(Array.isArray(draft.internalLinks) ? draft.internalLinks : initialPost?.internalLinks || []);
      setMessage("Restored unsaved draft from this browser.");
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    } finally {
      setDraftReady(true);
    }
  }, [draftStorageKey, initialPost]);

  useEffect(() => {
    if (!draftReady || typeof window === "undefined") {
      return;
    }

    const draft = {
      title,
      excerpt,
      contentFormat,
      content,
      coverImage,
      gallery,
      status,
      featured,
      trending,
      audience,
      categoryId,
      tags,
      seoTitle,
      seoDescription,
      authorName,
      publishedAt,
      scheduledFor,
      ctaTitle,
      ctaDescription,
      ctaLabel,
      ctaHref,
      popupEnabled,
      popupHeadline,
      popupSubheadline,
      popupLabel,
      popupHref,
      popupImage,
      popupTrigger,
      internalLinks,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [
    audience,
    authorName,
    categoryId,
    content,
    contentFormat,
    coverImage,
    ctaDescription,
    ctaHref,
    ctaLabel,
    ctaTitle,
    draftStorageKey,
    excerpt,
    featured,
    gallery,
    internalLinks,
    popupEnabled,
    popupHeadline,
    popupHref,
    popupImage,
    popupLabel,
    popupSubheadline,
    popupTrigger,
    publishedAt,
    scheduledFor,
    seoDescription,
    seoTitle,
    status,
    tags,
    title,
    trending,
    draftReady,
  ]);

  function toggleSuggestedLink(post: BlogPostRecord) {
    setInternalLinks((current) => {
      const exists = current.some((item) => item.slug === post.slug);
      if (exists) return current.filter((item) => item.slug !== post.slug);
      return [...current, { postId: post._id, title: post.title, slug: post.slug }];
    });
  }

  function insertSnippet(snippet: string) {
    setContent((current) => `${current}${current ? "\n\n" : ""}${snippet}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      title,
      excerpt,
      contentFormat,
      content,
      coverImage,
      gallery,
      status,
      featured,
      trending,
      audience,
      categoryId,
      tags,
      seoTitle,
      seoDescription,
      authorName,
      publishedAt: publishedAt || null,
      scheduledFor: scheduledFor || null,
      internalLinks,
      cta: {
        title: ctaTitle,
        description: ctaDescription,
        label: ctaLabel,
        href: ctaHref,
      },
      popup: {
        enabled: popupEnabled,
        headline: popupHeadline,
        subheadline: popupSubheadline,
        label: popupLabel,
        href: popupHref,
        image: popupImage,
        trigger: popupTrigger,
      },
    };

    const response = await fetch(
      mode === "create" ? "/api/admin/blog/posts" : `/api/admin/blog/posts/${initialPost?._id}`,
      {
        cache: "no-store",
        credentials: "include",
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Unable to save blog post.");
      setSaving(false);
      return;
    }

    setMessage("Post saved.");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey);
    }
    setSaving(false);
    router.replace("/admin/blg");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} action="#" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Blog editor</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{mode === "create" ? "Create blog post" : "Edit blog post"}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/blg" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Back to dashboard</Link>
          <button type="submit" disabled={saving} className="rounded-full bg-[#15616D] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : mode === "create" ? "Create post" : "Save changes"}</button>
        </div>
      </div>

      {message ? <p className="rounded-2xl bg-[#e7f8ef] px-4 py-3 text-sm text-[#15616D]">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="grid gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="How to Get More Clients for Your Salon in Nairobi" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Excerpt</span>
                <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Short teaser for cards, SEO, and social previews." />
              </label>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-medium text-slate-700">Content format</span>
                  <p className="mt-1 text-xs text-slate-500">Use Markdown for normal writing or HTML when you need custom embeds and layouts.</p>
                </div>
                <div className="flex rounded-full bg-slate-100 p-1">
                  <button type="button" onClick={() => setContentFormat("markdown")} className={`rounded-full px-4 py-2 text-xs font-semibold ${contentFormat === "markdown" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Markdown</button>
                  <button type="button" onClick={() => setContentFormat("html")} className={`rounded-full px-4 py-2 text-xs font-semibold ${contentFormat === "html" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>HTML</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {contentFormat === "markdown" ? (
                  <>
                    <button type="button" onClick={() => insertSnippet("## Section heading")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">H2</button>
                    <button type="button" onClick={() => insertSnippet("### Subheading")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">H3</button>
                    <button type="button" onClick={() => insertSnippet("- List item")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">List</button>
                    <button type="button" onClick={() => insertSnippet("> Quote goes here")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Quote</button>
                    <button type="button" onClick={() => insertSnippet(coverImage ? `![Blog image](${coverImage})` : "![Blog image](https://example.com/image.jpg)")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Image</button>
                    <button type="button" onClick={() => insertSnippet("[Read more](/blog/another-post-slug)")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Link</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => insertSnippet("<h2>Section heading</h2>")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">H2</button>
                    <button type="button" onClick={() => insertSnippet("<p>Paragraph text</p>")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Paragraph</button>
                    <button type="button" onClick={() => insertSnippet("<ul>\n  <li>List item</li>\n</ul>")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">List</button>
                    <button type="button" onClick={() => insertSnippet("<blockquote>Quote goes here.</blockquote>")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Quote</button>
                    <button type="button" onClick={() => insertSnippet(coverImage ? `<img src="${coverImage}" alt="Blog image" />` : '<img src="https://example.com/image.jpg" alt="Blog image" />')} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Image</button>
                    <button type="button" onClick={() => insertSnippet('<p><a href="/blog/another-post-slug">Read more</a></p>')} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Link</button>
                  </>
                )}
              </div>
              <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-[520px] w-full rounded-[1.5rem] border border-slate-200 px-4 py-4 font-mono text-sm outline-none focus:border-[#15616D]" placeholder={contentFormat === "markdown" ? "## Start writing your post\n\nThis editor accepts Markdown." : "<h2>Start writing your post</h2>\n<p>This editor accepts raw HTML.</p>"} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="font-serif text-3xl text-slate-900">{title || "Post title preview"}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{excerpt || "Excerpt preview appears here."}</p>
              <div className={contentPreviewClasses}>
                {contentFormat === "markdown" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "Start writing Markdown to preview your post."}</ReactMarkdown>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: previewHtml || "<p>Start writing HTML to preview your post.</p>" }} />
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">SEO title</span><input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Optional override" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Author</span><input value={authorName} onChange={(event) => setAuthorName(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" /></label>
            </div>
            <label className="mt-4 block space-y-2"><span className="text-sm font-medium text-slate-700">SEO description</span><textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Optional meta description override" /></label>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Internal linking</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Suggested related posts</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {availableLinks.map((post) => {
                const active = internalLinks.some((item) => item.slug === post.slug);
                return (
                  <button type="button" key={post._id} onClick={() => toggleSuggestedLink(post)} className={`rounded-[1.5rem] border p-4 text-left transition ${active ? "border-[#15616D] bg-[#e7f8ef]" : "border-slate-200 bg-slate-50"}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{post.categoryName || "General"}</p>
                    <p className="mt-2 font-semibold text-slate-900">{post.title}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="grid gap-4">
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Status</span><select value={status} onChange={(event) => setStatus(event.target.value as BlogPostRecord["status"])} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Audience</span><select value={audience} onChange={(event) => setAudience(event.target.value as BlogPostRecord["audience"])} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"><option value="all">All audiences</option><option value="owners">Service businesses</option><option value="affiliates">Affiliates</option></select></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Category</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"><option value="">No category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Tags</span><input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="nails, booking, portfolio" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Publish date</span><input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" /></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Schedule for</span><input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" /></label>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <label className="flex items-center gap-3"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />Feature on the landing page</label>
              <label className="flex items-center gap-3"><input type="checkbox" checked={trending} onChange={(event) => setTrending(event.target.checked)} />Mark as trending/popular</label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cloudinary media</p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2"><span className="text-sm font-medium text-slate-700">Cover image</span><ImageUpload value={coverImage ? [coverImage] : []} onChange={(urls) => setCoverImage(urls[0] || "")} uploadPreset="business_logos" maxFiles={1} /></div>
              <div className="space-y-2"><span className="text-sm font-medium text-slate-700">Gallery images / embed assets</span><ImageUpload value={gallery} onChange={setGallery} uploadPreset="business_logos" maxFiles={6} /></div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CTA block</p>
            <div className="mt-4 space-y-4">
              <input value={ctaTitle} onChange={(event) => setCtaTitle(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="CTA title" />
              <textarea value={ctaDescription} onChange={(event) => setCtaDescription(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="CTA description" />
              <input value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Button label" />
              <input value={ctaHref} onChange={(event) => setCtaHref(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="https://booking.lodday.com/setup?mode=trial" />
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pop-up</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Lead capture module</h2>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={popupEnabled} onChange={(event) => setPopupEnabled(event.target.checked)} />Enable</label>
            </div>
            <div className="mt-4 space-y-4">
              <input value={popupHeadline} onChange={(event) => setPopupHeadline(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Want weekly tips to grow your salon?" />
              <textarea value={popupSubheadline} onChange={(event) => setPopupSubheadline(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Educational pop-up copy" />
              <input value={popupLabel} onChange={(event) => setPopupLabel(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="Join WhatsApp channel" />
              <input value={popupHref} onChange={(event) => setPopupHref(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]" placeholder="https://wa.me/..." />
              <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">Trigger</span><select value={popupTrigger} onChange={(event) => setPopupTrigger(event.target.value as "scroll" | "bottom")} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#15616D]"><option value="scroll">After scrolling</option><option value="bottom">At bottom of post</option></select></label>
              <div className="space-y-2"><span className="text-sm font-medium text-slate-700">Popup image</span><ImageUpload value={popupImage ? [popupImage] : []} onChange={(urls) => setPopupImage(urls[0] || "")} uploadPreset="business_logos" maxFiles={1} /></div>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
