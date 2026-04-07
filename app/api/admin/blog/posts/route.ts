import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  ensureUniquePostSlug,
  normalizeTags,
  resolvePublishedStatus,
  serializeCategory,
  serializePost,
  syncCategoryFields,
} from "@/lib/blog";
import { looksLikeHtml, sanitizeHtml } from "@/lib/htmlSanitizer";
import { connectDB } from "@/lib/mongoDB";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

async function requirePlatformOwner() {
  const user = await currentUser();
  return Boolean(user?.id && user.id === process.env.PLATFORM_OWNER_CLERK_ID);
}

export async function GET() {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const [posts, categories] = await Promise.all([
      BlogPost.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean(),
      BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    return NextResponse.json({
      posts: posts.map(serializePost),
      categories: categories.map((item) => serializeCategory(item)),
    });
  } catch (error) {
    console.error("admin-blog-posts-get", error);
    return NextResponse.json({ error: "Unable to load posts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const title = String(body?.title || "").trim();
    const rawContent = String(body?.content || "");
    const requestedFormat = body?.contentFormat === "markdown" ? "markdown" : "html";
    const resolvedFormat = requestedFormat === "html" || looksLikeHtml(rawContent) ? "html" : "markdown";
    if (!title) {
      return NextResponse.json({ error: "Post title is required." }, { status: 400 });
    }

    const categoryFields = await syncCategoryFields(String(body?.categoryId || "").trim() || undefined);
    const schedule = resolvePublishedStatus(body?.status, body?.publishedAt, body?.scheduledFor);
    const popupPayload = {
      enabled: Boolean(body?.popup?.enabled),
      headline: String(body?.popup?.headline || "").trim(),
      subheadline: String(body?.popup?.subheadline || "").trim(),
      label: String(body?.popup?.label || "").trim(),
      href: String(body?.popup?.href || "").trim(),
      image: String(body?.popup?.image || "").trim(),
      trigger: body?.popup?.trigger === "bottom" ? "bottom" : "scroll",
    };

    const post = new BlogPost({
      title,
      slug: await ensureUniquePostSlug(title),
      excerpt: String(body?.excerpt || "").trim(),
      contentFormat: resolvedFormat,
      content: resolvedFormat === "markdown" ? rawContent : sanitizeHtml(rawContent),
      coverImage: String(body?.coverImage || "").trim(),
      gallery: Array.isArray(body?.gallery) ? body.gallery.map((item: unknown) => String(item || "").trim()).filter(Boolean) : [],
      status: schedule.status,
      featured: Boolean(body?.featured),
      trending: Boolean(body?.trending),
      audience: ["owners", "affiliates", "all"].includes(body?.audience) ? body.audience : "all",
      categoryId: categoryFields.categoryId,
      categoryName: categoryFields.categoryName,
      categorySlug: categoryFields.categorySlug,
      tags: normalizeTags(body?.tags || []),
      seoTitle: String(body?.seoTitle || "").trim(),
      seoDescription: String(body?.seoDescription || "").trim(),
      internalLinks: Array.isArray(body?.internalLinks)
        ? body.internalLinks
            .map((item: any) => ({
              postId: item?.postId || null,
              title: String(item?.title || "").trim(),
              slug: String(item?.slug || "").trim(),
            }))
            .filter((item: { title: string; slug: string }) => item.title && item.slug)
        : [],
      cta: {
        title: String(body?.cta?.title || "").trim(),
        description: String(body?.cta?.description || "").trim(),
        label: String(body?.cta?.label || "").trim(),
        href: String(body?.cta?.href || "").trim(),
      },
      popup: popupPayload,
      authorName: String(body?.authorName || "Lodday Team").trim(),
      publishedAt: schedule.publishedAt,
      scheduledFor: schedule.scheduledFor,
    });

    post.set("popup", popupPayload);
    await post.save();

    return NextResponse.json({ post: serializePost(post.toObject()) }, { status: 201 });
  } catch (error) {
    console.error("admin-blog-posts-post", error);
    return NextResponse.json({ error: "Unable to create post." }, { status: 500 });
  }
}
