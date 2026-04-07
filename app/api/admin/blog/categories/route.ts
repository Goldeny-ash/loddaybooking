import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { ensureUniqueCategorySlug, serializeCategory } from "@/lib/blog";
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

    const [categories, counts] = await Promise.all([
      BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean(),
      BlogPost.aggregate([{ $group: { _id: "$categoryId", postCount: { $sum: 1 } } }]),
    ]);

    const countMap = new Map<string, number>();
    counts.forEach((item) => {
      if (item?._id) countMap.set(String(item._id), Number(item.postCount || 0));
    });

    return NextResponse.json({
      categories: categories.map((item) => serializeCategory(item, countMap.get(String(item._id)) || 0)),
    });
  } catch (error) {
    console.error("admin-blog-categories-get", error);
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const category = await BlogCategory.create({
      name,
      slug: await ensureUniqueCategorySlug(name),
      description: String(body?.description || "").trim(),
      audience: ["owners", "affiliates", "all"].includes(body?.audience) ? body.audience : "all",
      heroImage: String(body?.heroImage || "").trim(),
      featured: Boolean(body?.featured),
      sortOrder: Number(body?.sortOrder || 0),
    });

    return NextResponse.json({ category: serializeCategory(category.toObject()) }, { status: 201 });
  } catch (error) {
    console.error("admin-blog-categories-post", error);
    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
