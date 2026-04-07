import Link from "next/link";

import BlogCategoryManager from "@/components/admin/BlogCategoryManager";
import { serializeCategory } from "@/lib/blog";
import { connectDB } from "@/lib/mongoDB";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

export default async function AdminBlogCategoriesPage() {
  await connectDB();
  const [categories, counts] = await Promise.all([
    BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
    BlogPost.aggregate([{ $group: { _id: "$categoryId", postCount: { $sum: 1 } } }]),
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((item) => {
    if (item?._id) countMap.set(String(item._id), Number(item.postCount || 0));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lodday blog admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Categories & lanes</h1>
        </div>
        <Link href="/admin/blg" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
          Back to blog dashboard
        </Link>
      </div>

      <BlogCategoryManager
        initialCategories={categories.map((item) => serializeCategory(item, countMap.get(String(item._id)) || 0))}
      />
    </div>
  );
}
