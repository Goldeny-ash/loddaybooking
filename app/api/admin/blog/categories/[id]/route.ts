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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const category = await BlogCategory.findById(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const nextName = String(body?.name || category.name || "").trim();
    if (!nextName) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    category.name = nextName;
    category.slug = await ensureUniqueCategorySlug(nextName, id);
    category.description = String(body?.description || "").trim();
    category.audience = ["owners", "affiliates", "all"].includes(body?.audience) ? body.audience : "all";
    category.heroImage = String(body?.heroImage || "").trim();
    category.featured = Boolean(body?.featured);
    category.sortOrder = Number(body?.sortOrder || 0);
    await category.save();

    await BlogPost.updateMany(
      { categoryId: category._id },
      {
        $set: {
          categoryName: category.name,
          categorySlug: category.slug,
        },
      }
    );

    return NextResponse.json({ category: serializeCategory(category.toObject()) });
  } catch (error) {
    console.error("admin-blog-category-patch", error);
    return NextResponse.json({ error: "Unable to update category." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requirePlatformOwner())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    await BlogCategory.findByIdAndDelete(id);
    await BlogPost.updateMany(
      { categoryId: id },
      {
        $set: {
          categoryId: null,
          categoryName: "",
          categorySlug: "",
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin-blog-category-delete", error);
    return NextResponse.json({ error: "Unable to delete category." }, { status: 500 });
  }
}
