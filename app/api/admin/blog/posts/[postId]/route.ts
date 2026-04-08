import { NextResponse } from "next/server";

import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import {
  buildRelatedPosts,
  ensureUniquePostSlug,
  normalizeTags,
  resolvePublishedStatus,
  serializePost,
  syncCategoryFields,
} from "@/lib/blog";
import { looksLikeHtml, sanitizeHtml } from "@/lib/htmlSanitizer";
import { connectDB } from "@/lib/mongoDB";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(_: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    await requirePlatformOwner();

    await connectDB();

    const { postId } = await params;
    const [post, others] = await Promise.all([
      BlogPost.findById(postId).lean(),
      BlogPost.find({ _id: { $ne: postId } }).sort({ updatedAt: -1 }).limit(20).lean(),
    ]);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const serializedPost = serializePost(post);
    const related = buildRelatedPosts(serializedPost, others.map(serializePost), 6);

    return NextResponse.json({
      post: serializedPost,
      suggestedLinks: related.map((item) => ({
        postId: item._id,
        title: item.title,
        slug: item.slug,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("admin-blog-post-get", error);
    return NextResponse.json({ error: "Unable to load post." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    await requirePlatformOwner();

    await connectDB();

    const { postId } = await params;
    const body = await request.json();
    const rawContent = String(body?.content || "");
    const requestedFormat = body?.contentFormat === "markdown" ? "markdown" : "html";
    const resolvedFormat = requestedFormat === "html" || looksLikeHtml(rawContent) ? "html" : "markdown";
    const post = await BlogPost.findById(postId);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const title = String(body?.title || "").trim();
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

    post.title = title;
    post.slug = await ensureUniquePostSlug(title, postId);
    post.excerpt = String(body?.excerpt || "").trim();
    post.contentFormat = resolvedFormat;
    post.content = resolvedFormat === "markdown" ? rawContent : sanitizeHtml(rawContent);
    post.coverImage = String(body?.coverImage || "").trim();
    post.gallery = Array.isArray(body?.gallery) ? body.gallery.map((item: unknown) => String(item || "").trim()).filter(Boolean) : [];
    post.status = schedule.status;
    post.featured = Boolean(body?.featured);
    post.trending = Boolean(body?.trending);
    post.audience = ["owners", "affiliates", "all"].includes(body?.audience) ? body.audience : "all";
    post.categoryId = categoryFields.categoryId;
    post.categoryName = categoryFields.categoryName;
    post.categorySlug = categoryFields.categorySlug;
    post.tags = normalizeTags(body?.tags || []);
    post.seoTitle = String(body?.seoTitle || "").trim();
    post.seoDescription = String(body?.seoDescription || "").trim();
    post.internalLinks = Array.isArray(body?.internalLinks)
      ? body.internalLinks
          .map((item: any) => ({
            postId: item?.postId || null,
            title: String(item?.title || "").trim(),
            slug: String(item?.slug || "").trim(),
          }))
          .filter((item: { title: string; slug: string }) => item.title && item.slug)
      : [];
    post.cta = {
      title: String(body?.cta?.title || "").trim(),
      description: String(body?.cta?.description || "").trim(),
      label: String(body?.cta?.label || "").trim(),
      href: String(body?.cta?.href || "").trim(),
    };
    post.set("popup", popupPayload);
    post.authorName = String(body?.authorName || "Lodday Team").trim();
    post.publishedAt = schedule.publishedAt;
    post.scheduledFor = schedule.scheduledFor;
    await post.save();

    return NextResponse.json({ post: serializePost(post.toObject()) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("admin-blog-post-patch", error);
    return NextResponse.json({ error: "Unable to update post." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    await requirePlatformOwner();

    await connectDB();

    const { postId } = await params;
    await BlogPost.findByIdAndDelete(postId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("admin-blog-post-delete", error);
    return NextResponse.json({ error: "Unable to delete post." }, { status: 500 });
  }
}
