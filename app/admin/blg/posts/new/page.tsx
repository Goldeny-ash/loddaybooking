import BlogPostEditor from "@/components/admin/BlogPostEditor";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { serializeCategory, serializePost } from "@/lib/blog";
import { connectDB } from "@/lib/mongoDB";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

export default async function AdminNewBlogPostPage() {
  await requirePlatformOwner();
  await connectDB();

  const [categories, posts] = await Promise.all([
    BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    BlogPost.find({}).sort({ updatedAt: -1 }).lean(),
  ]);

  return (
    <BlogPostEditor
      mode="create"
      categories={categories.map((item) => serializeCategory(item))}
      posts={posts.map(serializePost)}
    />
  );
}
