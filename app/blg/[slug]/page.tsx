import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import BlogPostPopup from "@/components/blog/BlogPostPopup";
import BlogShell from "@/components/blog/BlogShell";
import { buildRelatedPosts, buildPublicPostFilter, serializePost } from "@/lib/blog";
import { blogHref, getBlogBasePath } from "@/lib/blogRouting";
import { looksLikeHtml, sanitizeHtml } from "@/lib/htmlSanitizer";
import { connectDB } from "@/lib/mongoDB";
import BlogPost from "@/lib/models/BlogPost";

const articleClasses =
  "max-w-none [&_a]:text-[#8fdbd1] [&_a]:underline [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-l-[#15616D] [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-white/70 [&_em]:italic [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:font-serif [&_h1]:text-4xl [&_h1]:text-white [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:text-white [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:text-white [&_img]:my-8 [&_img]:rounded-[1.75rem] [&_img]:shadow-[0_18px_40px_rgba(0,0,0,0.22)] [&_li]:mb-3 [&_li]:text-white/78 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_p]:leading-8 [&_p]:text-white/78 [&_strong]:font-semibold [&_strong]:text-white [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const post = await BlogPost.findOne({ ...buildPublicPostFilter({}), slug }).lean();

  if (!post) {
    return {
      title: "Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const serialized = serializePost(post);
  const title = serialized.seoTitle || serialized.title;
  const description = serialized.seoDescription || serialized.excerpt;
  const canonical = `https://blog.lodday.com/${serialized.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Lodday Blog",
      type: "article",
      images: serialized.coverImage ? [{ url: serialized.coverImage, alt: serialized.title }] : undefined,
    },
    twitter: {
      card: serialized.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: serialized.coverImage ? [serialized.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const basePath = await getBlogBasePath();
  const { slug } = await params;

  const postDoc = await BlogPost.findOne({ ...buildPublicPostFilter({}), slug }).lean();
  if (!postDoc) notFound();

  const post = serializePost(postDoc);
  const renderAsHtml = post.contentFormat === "html" || looksLikeHtml(post.content);
  const safeHtml = sanitizeHtml(post.content);
  const relatedDocs = await BlogPost.find({
    ...buildPublicPostFilter({ audience: post.audience }),
    slug: { $ne: post.slug },
  })
    .sort({ featured: -1, publishedAt: -1 })
    .limit(8)
    .lean();

  const relatedPosts = buildRelatedPosts(post, relatedDocs.map(serializePost), 4);
  const toc =
    !renderAsHtml
      ? post.content
          .split("\n")
          .filter((line) => /^##\s+/.test(line))
          .map((line, index) => ({
            id: `section-${index + 1}`,
            title: line.replace(/^##\s+/, "").trim(),
          }))
      : Array.from(safeHtml.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)).map((match, index) => ({
          id: `section-${index + 1}`,
          title: String(match[1] || "").replace(/<[^>]+>/g, "").trim(),
        }));

  let htmlHeadingIndex = 0;
  const processedHtml =
    renderAsHtml
      ? (safeHtml || "<p>No content yet.</p>").replace(
          /<h2([^>]*)>/gi,
          (_match, attrs) => `<h2 id="section-${++htmlHeadingIndex}"${attrs}>`
        )
      : "";

  return (
    <BlogShell compact basePath={basePath}>
      <main className="bg-[#23201d] text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(21,97,109,0.2),transparent_32%),linear-gradient(135deg,#191715_0%,#23201d_55%,#2b2825_100%)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
            <div className="order-2 space-y-6 lg:order-1 lg:pr-6">
              <Link href={blogHref(basePath)} className="inline-flex text-sm font-medium text-white/80">
                ← Back to blog
              </Link>

              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((item) => (
                  <Link key={item} href={blogHref(basePath, `?tag=${encodeURIComponent(item)}`)} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/85">
                    {item}
                  </Link>
                ))}
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-serif text-4xl leading-tight text-white md:text-6xl">{post.title}</h1>
                <p className="max-w-2xl text-lg leading-8 text-white/70">{post.excerpt}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#15616D] text-lg font-semibold text-white">
                  {post.authorName.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold text-white">{post.authorName}</p>
                  <p className="text-sm text-white/65">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"} • {post.readTimeMinutes} min read
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 overflow-hidden rounded-[2rem] border border-white/8 bg-[#2d2a26] lg:order-2">
              {post.coverImage ? (
                <img src={post.coverImage} alt={post.title} className="h-full min-h-[340px] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex min-h-[340px] items-center justify-center bg-[linear-gradient(135deg,#0e3e48_0%,#23201d_100%)] text-sm uppercase tracking-[0.24em] text-white/60">
                  Lodday Blog
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.55fr] lg:px-8">
          <article className="space-y-8">
            <div className="rounded-[2rem] border border-white/8 bg-[#2a2724] p-8 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <div className={articleClasses}>
                {renderAsHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children, ...props }) => {
                        const title = String(children).trim();
                        const index = toc.findIndex((item) => item.title === title);
                        const id = index >= 0 ? toc[index].id : undefined;
                        return (
                          <h2 id={id} {...props}>
                            {children}
                          </h2>
                        );
                      },
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                )}
              </div>

              {post.internalLinks.length ? (
                <div className="mt-10 rounded-[1.5rem] border border-white/8 bg-[#201d1a] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fdbd1]">Keep reading</p>
                  <div className="mt-4 space-y-3">
                    {post.internalLinks.map((item) => (
                      <div key={item.slug}>
                        <Link href={blogHref(basePath, item.slug)} className="font-semibold text-[#8fdbd1]">
                          {item.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-white/8 bg-[#2a2724] p-6">
              <p className="text-sm font-semibold text-white">Table of contents</p>
              <div className="mt-4 space-y-4">
                {toc.length ? (
                  toc.map((item, index) => (
                    <a key={item.id} href={`#${item.id}`} className="block border-b border-white/8 pb-4 text-sm text-white/72 transition hover:text-white">
                      {String(index + 1).padStart(2, "0")} - {item.title}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-white/60">Add <code>##</code> headings in Markdown or <code>&lt;h2&gt;</code> tags in HTML to generate a table of contents.</p>
                )}
              </div>
            </div>

            {(post.cta.title || post.cta.label) ? (
              <div className="rounded-[2rem] bg-[linear-gradient(135deg,#15616D_0%,#0e3e48_100%)] p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b4ece4]">Next step</p>
                <h2 className="mt-3 text-2xl font-semibold">{post.cta.title || "Take action on Lodday"}</h2>
                {post.cta.description ? <p className="mt-3 text-sm leading-7 text-white/80">{post.cta.description}</p> : null}
                {post.cta.href && post.cta.label ? (
                  <a href={post.cta.href} className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#15616D]">
                    {post.cta.label}
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-white/8 bg-[#2a2724] p-6">
              <p className="text-sm font-semibold text-white">Related posts</p>
              <div className="mt-4 space-y-4">
                {relatedPosts.map((item) => (
                  <Link key={item._id} href={blogHref(basePath, item.slug)} className="block rounded-[1.5rem] bg-[#201d1a] p-4 transition hover:-translate-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fdbd1]">{item.categoryName || "General"}</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{item.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <BlogPostPopup popup={post.popup} />
    </BlogShell>
  );
}
