import BlogAdminDashboardClient from "@/components/admin/BlogAdminDashboardClient";
import { requirePlatformOwner } from "@/lib/auth/isPlatformOwner";
import { serializeCategory, serializePost } from "@/lib/blog";
import { connectDB } from "@/lib/mongoDB";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  await requirePlatformOwner();
  await connectDB();

  const [posts, categories, counts] = await Promise.all([
    BlogPost.find({}).sort({ updatedAt: -1, createdAt: -1 }).lean(),
    BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    BlogPost.aggregate([{ $group: { _id: "$categoryId", postCount: { $sum: 1 } } }]),
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((item) => {
    if (item?._id) countMap.set(String(item._id), Number(item.postCount || 0));
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lodday blog admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Blog dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Manage public blog content for <span className="font-semibold">blog.lodday.com</span> while keeping editing tools safely inside the Clerk-protected admin side.
        </p>
      </div>

      <BlogAdminDashboardClient
        posts={posts.map(serializePost)}
        categories={categories.map((item) => serializeCategory(item, countMap.get(String(item._id)) || 0))}
      />
    </div>
  );
}
