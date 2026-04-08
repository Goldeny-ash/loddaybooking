import { notFound } from "next/navigation";
import mongoose from "mongoose";

import BlogPostEditor from "@/components/admin/BlogPostEditor";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { serializeCategory, serializePost } from "@/lib/blog";
import { connectDB } from "@/lib/mongoDB";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

export const dynamic = "force-dynamic";

export default async function AdminEditBlogPostPage({ params }: { params: Promise<{ postId: string }> }) {
  await requirePlatformOwner();
  await connectDB();
  const { postId } = await params;

  const [post, categories, posts] = await Promise.all([
    mongoose.Types.ObjectId.isValid(postId)
      ? BlogPost.findById(postId).lean()
      : BlogPost.findOne({ slug: postId }).lean(),
    BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    BlogPost.find({}).sort({ updatedAt: -1 }).lean(),
  ]);

  if (!post) notFound();

  return (
    <BlogPostEditor
      mode="edit"
      initialPost={serializePost(post)}
      categories={categories.map((item) => serializeCategory(item))}
      posts={posts.map(serializePost)}
    />
  );
}
