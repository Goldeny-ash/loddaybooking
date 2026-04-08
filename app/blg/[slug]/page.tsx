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
  "max-w-none min-w-0 break-words [&_*]:max-w-full [&_a]:break-all [&_a]:text-[var(--blog-link)] [&_a]:underline [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-l-[var(--blog-accent)] [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[var(--blog-text-muted)] [&_code]:whitespace-pre-wrap [&_em]:italic [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:font-serif [&_h1]:text-4xl [&_h1]:text-[var(--blog-text)] [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:break-words [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:text-[var(--blog-text)] [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:break-words [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:leading-tight [&_h3]:text-[var(--blog-text)] [&_img]:my-8 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[1.75rem] [&_img]:shadow-[0_18px_40px_rgba(0,0,0,0.22)] [&_li]:mb-3 [&_li]:text-[var(--blog-text-muted)] [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_p]:break-words [&_p]:leading-8 [&_p]:text-[var(--blog-text-muted)] [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-black/10 [&_pre]:p-4 [&_strong]:font-semibold [&_strong]:text-[var(--blog-text)] [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:whitespace-nowrap [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6";

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
      <main className="w-full overflow-x-hidden bg-[var(--blog-page-bg)] text-[var(--blog-text)] transition-colors duration-300">
        <section className="border-b border-[var(--blog-border)] bg-[var(--blog-page-bg)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
            <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:pr-6">
              <Link href={blogHref(basePath)} className="inline-flex text-sm font-medium text-[var(--blog-text-muted)]">
                Back to blog
              </Link>

              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((item) => (
                  <Link
                    key={item}
                    href={blogHref(basePath, `?tag=${encodeURIComponent(item)}`)}
                    className="rounded-full border border-[var(--blog-border)] px-4 py-2 text-sm text-[var(--blog-text-muted)]"
                  >
                    {item}
                  </Link>
                ))}
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl break-words font-serif text-4xl leading-tight text-[var(--blog-text)] md:text-6xl">
                  {post.title}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--blog-text-muted)]">{post.excerpt}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--blog-accent)] text-lg font-semibold text-[var(--blog-accent-contrast)]">
                  {post.authorName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--blog-text)]">{post.authorName}</p>
                  <p className="text-sm text-[var(--blog-text-soft)]">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"} • {post.readTimeMinutes} min read
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 overflow-hidden rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-surface-elevated)] lg:order-2">
              {post.coverImage ? (
                <img src={post.coverImage} alt={post.title} className="h-full min-h-[340px] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex min-h-[340px] items-center justify-center bg-[var(--blog-surface-elevated)] text-sm uppercase tracking-[0.24em] text-[var(--blog-text-soft)]">
                  Lodday Blog
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.55fr)] lg:px-8">
          <article className="min-w-0 space-y-8">
            <div className="overflow-hidden rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-surface)] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:p-8">
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
                <div className="mt-10 rounded-[1.5rem] border border-[var(--blog-border)] bg-[var(--blog-surface-muted)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blog-link)]">Keep reading</p>
                  <div className="mt-4 space-y-3">
                    {post.internalLinks.map((item) => (
                      <div key={item.slug}>
                        <Link href={blogHref(basePath, item.slug)} className="font-semibold text-[var(--blog-link)]">
                          {item.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <aside className="min-w-0 space-y-6">
            <div className="rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-surface)] p-6">
              <p className="text-sm font-semibold text-[var(--blog-text)]">Table of contents</p>
              <div className="mt-4 space-y-4">
                {toc.length ? (
                  toc.map((item, index) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block break-words border-b border-[var(--blog-border)] pb-4 text-sm text-[var(--blog-text-muted)] transition hover:text-[var(--blog-text)]"
                    >
                      {String(index + 1).padStart(2, "0")} - {item.title}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-[var(--blog-text-soft)]">
                    Add <code>##</code> headings in Markdown or <code>&lt;h2&gt;</code> tags in HTML to generate a table of contents.
                  </p>
                )}
              </div>
            </div>

            {post.cta.title || post.cta.label ? (
              <div className="rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-surface)] p-6 text-[var(--blog-text)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--blog-text-soft)]">Next step</p>
                <h2 className="mt-3 text-2xl font-semibold">{post.cta.title || "Take action on Lodday"}</h2>
                {post.cta.description ? <p className="mt-3 text-sm leading-7 text-[var(--blog-text-muted)]">{post.cta.description}</p> : null}
                {post.cta.href && post.cta.label ? (
                  <a
                    href={post.cta.href}
                    className="mt-5 inline-flex rounded-full bg-[var(--blog-accent)] px-4 py-2 text-sm font-semibold text-[var(--blog-accent-contrast)]"
                  >
                    {post.cta.label}
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-surface)] p-6">
              <p className="text-sm font-semibold text-[var(--blog-text)]">Related posts</p>
              <div className="mt-4 space-y-4">
                {relatedPosts.map((item) => (
                  <Link
                    key={item._id}
                    href={blogHref(basePath, item.slug)}
                    className="block rounded-[1.5rem] border border-[var(--blog-border)] bg-[var(--blog-surface-muted)] p-4 transition hover:-translate-y-1"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--blog-link)]">{item.categoryName || "General"}</p>
                    <h3 className="mt-2 break-words text-lg font-semibold text-[var(--blog-text)]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--blog-text-muted)]">{item.excerpt}</p>
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
