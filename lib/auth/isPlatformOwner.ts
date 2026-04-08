import { auth } from "@clerk/nextjs/server";

export async function getCurrentClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return typeof userId === "string" && userId ? userId : null;
}

export async function isPlatformOwner(): Promise<boolean> {
  const userId = await getCurrentClerkUserId();
  const ownerId = process.env.PLATFORM_OWNER_CLERK_ID;
  return Boolean(userId && ownerId && userId === ownerId);
}

export async function requirePlatformOwner(): Promise<string> {
  const userId = await getCurrentClerkUserId();
  const ownerId = process.env.PLATFORM_OWNER_CLERK_ID;

  if (!userId || !ownerId || userId !== ownerId) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}
