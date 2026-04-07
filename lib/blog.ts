import slugify from "slugify";

import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";

export type BlogAudience = "owners" | "affiliates" | "all";
export type BlogStatus = "draft" | "published" | "scheduled";

export type BlogCategoryRecord = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  audience: BlogAudience;
  heroImage: string;
  featured: boolean;
  sortOrder: number;
  postCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BlogPostRecord = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentFormat: "markdown" | "html";
  content: string;
  coverImage: string;
  gallery: string[];
  status: BlogStatus;
  featured: boolean;
  trending: boolean;
  audience: BlogAudience;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  internalLinks: Array<{ postId: string; title: string; slug: string }>;
  cta: { title: string; description: string; label: string; href: string };
  popup: {
    enabled: boolean;
    headline: string;
    subheadline: string;
    label: string;
    href: string;
    image: string;
    trigger: "scroll" | "bottom";
  };
  authorName: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt?: string;
  updatedAt?: string;
  readTimeMinutes: number;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createBlogSlug(value: string) {
  return slugify(asText(value), { lower: true, strict: true, trim: true });
}

export function normalizeTags(tags: string[] | string) {
  const raw = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return Array.from(
    new Set(
      raw
        .map((tag) => asText(tag).toLowerCase())
        .filter(Boolean)
    )
  );
}

export function stripMarkdown(content: string) {
  return asText(content)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadTimeMinutes(content: string) {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function serializeCategory(doc: any, postCount?: number): BlogCategoryRecord {
  return {
    _id: String(doc?._id || ""),
    name: asText(doc?.name),
    slug: asText(doc?.slug),
    description: asText(doc?.description),
    audience: (doc?.audience || "all") as BlogAudience,
    heroImage: asText(doc?.heroImage),
    featured: Boolean(doc?.featured),
    sortOrder: Number(doc?.sortOrder || 0),
    postCount,
    createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export function serializePost(doc: any): BlogPostRecord {
  const content = asText(doc?.content);
  return {
    _id: String(doc?._id || ""),
    title: asText(doc?.title),
    slug: asText(doc?.slug),
    excerpt: asText(doc?.excerpt),
    contentFormat: doc?.contentFormat === "html" ? "html" : "markdown",
    content,
    coverImage: asText(doc?.coverImage),
    gallery: Array.isArray(doc?.gallery) ? doc.gallery.map((item: unknown) => asText(item)).filter(Boolean) : [],
    status: (doc?.status || "draft") as BlogStatus,
    featured: Boolean(doc?.featured),
    trending: Boolean(doc?.trending),
    audience: (doc?.audience || "all") as BlogAudience,
    categoryId: doc?.categoryId ? String(doc.categoryId) : "",
    categoryName: asText(doc?.categoryName),
    categorySlug: asText(doc?.categorySlug),
    tags: normalizeTags(Array.isArray(doc?.tags) ? doc.tags : []),
    seoTitle: asText(doc?.seoTitle),
    seoDescription: asText(doc?.seoDescription),
    internalLinks: Array.isArray(doc?.internalLinks)
      ? doc.internalLinks
          .map((item: any) => ({
            postId: item?.postId ? String(item.postId) : "",
            title: asText(item?.title),
            slug: asText(item?.slug),
          }))
          .filter((item: { slug: string; title: string }) => item.slug && item.title)
      : [],
    cta: {
      title: asText(doc?.cta?.title),
      description: asText(doc?.cta?.description),
      label: asText(doc?.cta?.label),
      href: asText(doc?.cta?.href),
    },
    popup: {
      enabled: Boolean(doc?.popup?.enabled),
      headline: asText(doc?.popup?.headline),
      subheadline: asText(doc?.popup?.subheadline),
      label: asText(doc?.popup?.label),
      href: asText(doc?.popup?.href),
      image: asText(doc?.popup?.image),
      trigger: doc?.popup?.trigger === "bottom" ? "bottom" : "scroll",
    },
    authorName: asText(doc?.authorName) || "Lodday Team",
    publishedAt: doc?.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
    scheduledFor: doc?.scheduledFor ? new Date(doc.scheduledFor).toISOString() : null,
    createdAt: doc?.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    readTimeMinutes: estimateReadTimeMinutes(content),
  };
}

export async function ensureUniqueCategorySlug(name: string, excludeId?: string) {
  const base = createBlogSlug(name) || "category";
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await BlogCategory.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();

    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export async function ensureUniquePostSlug(title: string, excludeId?: string) {
  const base = createBlogSlug(title) || "post";
  let slug = base;
  let suffix = 1;

  while (true) {
    const existing = await BlogPost.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();

    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export function resolvePublishedStatus(status: BlogStatus, publishedAt?: string, scheduledFor?: string) {
  const now = new Date();
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
  const publishedDate = publishedAt ? new Date(publishedAt) : null;

  if (status === "published") {
    return {
      status,
      publishedAt: publishedDate && !Number.isNaN(publishedDate.getTime()) ? publishedDate : now,
      scheduledFor: scheduledDate && !Number.isNaN(scheduledDate.getTime()) ? scheduledDate : null,
    };
  }

  if (status === "scheduled") {
    const target = scheduledDate && !Number.isNaN(scheduledDate.getTime()) ? scheduledDate : now;
    return {
      status,
      publishedAt: target <= now ? target : null,
      scheduledFor: target,
    };
  }

  return {
    status: "draft" as BlogStatus,
    publishedAt: publishedDate && !Number.isNaN(publishedDate.getTime()) ? publishedDate : null,
    scheduledFor: scheduledDate && !Number.isNaN(scheduledDate.getTime()) ? scheduledDate : null,
  };
}

export async function getPublishedCategories() {
  const categories = await BlogCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await BlogPost.aggregate([
    {
      $match: {
        $or: [
          { status: "published", publishedAt: { $lte: new Date() } },
          { status: "scheduled", publishedAt: { $lte: new Date() } },
        ],
      },
    },
    { $group: { _id: "$categoryId", postCount: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((item) => {
    if (item?._id) countMap.set(String(item._id), Number(item.postCount || 0));
  });

  return categories
    .map((item) => serializeCategory(item, countMap.get(String(item._id)) || 0))
    .filter((item) => (item.postCount || 0) > 0);
}

export function buildPublicPostFilter({
  audience,
  categorySlug,
  tag,
  search,
}: {
  audience?: string;
  categorySlug?: string;
  tag?: string;
  search?: string;
}) {
  const now = new Date();
  const filter: Record<string, unknown> = {
    $or: [
      { status: "published", publishedAt: { $lte: now } },
      { status: "scheduled", publishedAt: { $lte: now } },
    ],
  };

  if (audience && audience !== "all") {
    filter.audience = { $in: [audience, "all"] };
  }

  if (categorySlug) {
    filter.categorySlug = categorySlug;
  }

  if (tag) {
    filter.tags = asText(tag).toLowerCase();
  }

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$and = [
      {
        $or: [{ title: regex }, { excerpt: regex }, { content: regex }, { tags: regex }, { categoryName: regex }],
      },
    ];
  }

  return filter;
}

export function getAudienceCopy(audience: BlogAudience) {
  if (audience === "owners") {
    return {
      title: "Grow Your Service Business",
      description: "Tutorials, pricing guidance, and client-retention ideas for Kenyan service businesses.",
      ctaLabel: "Start using Lodday",
      ctaHref: "https://booking.lodday.com/setup?mode=trial",
    };
  }

  if (audience === "affiliates") {
    return {
      title: "Make Money Helping Businesses",
      description: "Side-hustle guides, referral tactics, and opportunity spotting for affiliates and referrers.",
      ctaLabel: "Join the affiliate program",
      ctaHref: "https://affiliates.lodday.com",
    };
  }

  return {
    title: "Latest from Lodday",
    description: "Fresh ideas for growth, trends, and practical playbooks.",
    ctaLabel: "Read the latest blogs",
    ctaHref: "/",
  };
}

export function buildRelatedPosts(source: BlogPostRecord, posts: BlogPostRecord[], limit = 3) {
  const sourceTags = new Set(source.tags);

  return posts
    .filter((item) => item._id !== source._id)
    .map((item) => {
      let score = 0;
      if (item.categorySlug && item.categorySlug === source.categorySlug) score += 3;
      if (item.audience === source.audience) score += 2;
      if (item.audience === "all" || source.audience === "all") score += 1;
      item.tags.forEach((tag) => {
        if (sourceTags.has(tag)) score += 1;
      });
      if (item.featured) score += 0.5;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || (b.item.publishedAt || "").localeCompare(a.item.publishedAt || ""))
    .slice(0, limit)
    .map(({ item }) => item);
}

export async function syncCategoryFields(categoryId?: string) {
  if (!categoryId) {
    return {
      categoryId: null,
      categoryName: "",
      categorySlug: "",
    };
  }

  const category = await BlogCategory.findById(categoryId).lean();
  if (!category) {
    return {
      categoryId: null,
      categoryName: "",
      categorySlug: "",
    };
  }

  const serialized = serializeCategory(category);
  return {
    categoryId: serialized._id,
    categoryName: serialized.name,
    categorySlug: serialized.slug,
  };
}
