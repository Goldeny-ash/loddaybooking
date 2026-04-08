import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogShell from "@/components/blog/BlogShell";
import { buildPublicPostFilter, serializeCategory, serializePost } from "@/lib/blog";
import { blogHref, getBlogBasePath } from "@/lib/blogRouting";
import { connectDB } from "@/lib/mongoDB";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const category = await BlogCategory.findOne({ slug }).lean();

  if (!category) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: false },
    };
  }

  const serialized = serializeCategory(category);
  const title = `${serialized.name} Articles`;
  const description =
    serialized.description || `Browse Lodday blog posts in ${serialized.name} for service businesses and affiliates in Kenya.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://blog.lodday.com/category/${serialized.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://blog.lodday.com/category/${serialized.slug}`,
      siteName: "Lodday Blog",
      type: "website",
    },
  };
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const basePath = await getBlogBasePath();
  const { slug } = await params;

  const [category, posts] = await Promise.all([
    BlogCategory.findOne({ slug }).lean(),
    BlogPost.find(buildPublicPostFilter({ categorySlug: slug })).sort({ featured: -1, publishedAt: -1 }).lean(),
  ]);

  if (!category) notFound();

  const currentCategory = serializeCategory(category);
  const serializedPosts = posts.map(serializePost);

  return (
    <BlogShell compact basePath={basePath}>
      <main className="mx-auto max-w-7xl bg-[var(--blog-page-bg)] px-4 py-10 text-[var(--blog-text)] transition-colors duration-300 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <Link href={blogHref(basePath)} className="text-sm font-medium text-[var(--blog-link)]">
            Back to blog
          </Link>
          <div className="rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-surface)] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b5b2e]">Category</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--blog-text)]">{currentCategory.name}</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--blog-text-muted)]">
              {currentCategory.description || "A curated set of Lodday articles to help readers find exactly what they need."}
            </p>
          </div>
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serializedPosts.map((post) => (
            <article key={post._id} className="rounded-[2rem] border border-[var(--blog-border)] bg-[var(--blog-card)] p-6 shadow-sm">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b5b2e]">
                <span>{post.audience}</span>
                <span>{post.readTimeMinutes} min read</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--blog-card-text)]">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--blog-card-muted)]">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.slice(0, 4).map((item) => (
                  <Link key={item} href={blogHref(basePath, `?tag=${encodeURIComponent(item)}`)} className="rounded-full bg-[var(--blog-surface-muted)] px-3 py-1 text-xs text-[#9b5b2e]">
                    #{item}
                  </Link>
                ))}
              </div>
              <Link href={blogHref(basePath, post.slug)} className="mt-5 inline-flex font-semibold text-[var(--blog-link)]">
                Read article
              </Link>
            </article>
          ))}
        </section>
      </main>
    </BlogShell>
  );
}
