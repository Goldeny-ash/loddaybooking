import { NextRequest, NextResponse } from "next/server";

import { buildPublicPostFilter, getPublishedCategories, serializePost } from "@/lib/blog";
import { connectDB } from "@/lib/mongoDB";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const audience = searchParams.get("audience") || "";
    const category = searchParams.get("category") || "";
    const tag = searchParams.get("tag") || "";
    const search = searchParams.get("search") || "";
    const featured = searchParams.get("featured") === "true";
    const trending = searchParams.get("trending") === "true";
    const limit = Math.min(Number(searchParams.get("limit") || 12), 30);

    const filter = buildPublicPostFilter({
      audience,
      categorySlug: category,
      tag,
      search,
    });

    if (featured) filter.featured = true;
    if (trending) filter.trending = true;

    const [posts, categories] = await Promise.all([
      BlogPost.find(filter).sort({ featured: -1, publishedAt: -1, updatedAt: -1 }).limit(limit).lean(),
      getPublishedCategories(),
    ]);

    return NextResponse.json({
      posts: posts.map(serializePost),
      categories,
    });
  } catch (error) {
    console.error("blog-public-get", error);
    return NextResponse.json({ error: "Unable to load blog content." }, { status: 500 });
  }
}
