import BlogShell from "@/components/blog/BlogShell";
import BlogHomeClient from "@/components/blog/BlogHomeClient";
import { buildPublicPostFilter, serializePost } from "@/lib/blog";
import { getBlogBasePath } from "@/lib/blogRouting";
import { connectDB } from "@/lib/mongoDB";
import BlogPost from "@/lib/models/BlogPost";

type SearchShape = Promise<{
  q?: string;
}>;

export default async function BlogHomePage({ searchParams }: { searchParams: SearchShape }) {
  await connectDB();
  const basePath = await getBlogBasePath();
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";

  const [featuredDocs, latestDocs] = await Promise.all([
    BlogPost.find({ ...buildPublicPostFilter({ search: q }), featured: true })
      .sort({ publishedAt: -1, updatedAt: -1 })
      .limit(8)
      .lean(),
    BlogPost.find(buildPublicPostFilter({ search: q }))
      .sort({ featured: -1, publishedAt: -1, updatedAt: -1 })
      .limit(24)
      .lean(),
  ]);

  const featuredPosts = featuredDocs.map(serializePost);
  const latestPosts = latestDocs.map(serializePost);

  return (
    <BlogShell basePath={basePath}>
      <BlogHomeClient
        basePath={basePath}
        featuredPosts={featuredPosts}
        latestPosts={latestPosts}
        initialSearch={q}
      />
    </BlogShell>
  );
}
