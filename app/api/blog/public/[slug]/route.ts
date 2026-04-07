import { NextResponse } from "next/server";

import { buildPublicPostFilter, serializePost } from "@/lib/blog";
import { connectDB } from "@/lib/mongoDB";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();

    const { slug } = await params;
    const filter = buildPublicPostFilter({});
    const post = await BlogPost.findOne({
      ...filter,
      slug,
    }).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ post: serializePost(post) });
  } catch (error) {
    console.error("blog-public-slug-get", error);
    return NextResponse.json({ error: "Unable to load post." }, { status: 500 });
  }
}
