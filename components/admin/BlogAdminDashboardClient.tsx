"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BlogCategoryRecord, BlogPostRecord } from "@/lib/blog";

type Props = {
  posts: BlogPostRecord[];
  categories: BlogCategoryRecord[];
};

export default function BlogAdminDashboardClient({ posts, categories }: Props) {
  const [items, setItems] = useState(posts);

  const stats = useMemo(() => {
    return {
      total: items.length,
      published: items.filter((item) => item.status === "published").length,
      drafts: items.filter((item) => item.status === "draft").length,
      scheduled: items.filter((item) => item.status === "scheduled").length,
      featured: items.filter((item) => item.featured).length,
      trending: items.filter((item) => item.trending).length,
    };
  }, [items]);

  async function removePost(postId: string) {
    const confirmed = window.confirm("Delete this blog post?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/blog/posts/${postId}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => item._id !== postId));
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "All Posts", value: stats.total },
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.drafts },
          { label: "Scheduled", value: stats.scheduled },
          { label: "Featured", value: stats.featured },
          { label: "Trending", value: stats.trending },
        ].map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recent posts</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Manage content</h2>
            </div>
            <Link href="/admin/blg/posts/new" className="rounded-full bg-[#15616D] px-4 py-2 text-sm font-semibold text-white">
              Create Post
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {items.map((post) => (
              <article key={post._id} className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <span>{post.status}</span>
                      <span>{post.audience}</span>
                      {post.featured ? <span>featured</span> : null}
                      {post.trending ? <span>trending</span> : null}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{post.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{post.categoryName || "No category"} • /{post.slug}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://blog.lodday.com/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      View
                    </a>
                    <Link href={`/admin/blg/posts/${post._id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => removePost(post._id)}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Categories</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Content lanes</h2>
              </div>
              <Link href="/admin/blg/categories" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Manage
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {categories.map((category) => (
                <div key={category._id} className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <p className="text-sm text-slate-600">
                    {category.audience} • {category.postCount || 0} posts
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-[linear-gradient(135deg,#fff4df_0%,#f7e8d2_100%)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b5b2e]">Quick actions</p>
            <div className="mt-4 space-y-3 text-sm text-slate-800">
              <div>Create drafts, publish trend roundups, and keep featured cards fresh.</div>
              <div>Use internal links in each post to push readers deeper into the blog.</div>
              <div>Pair business-owner content with affiliate content to cross-pollinate traffic.</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
