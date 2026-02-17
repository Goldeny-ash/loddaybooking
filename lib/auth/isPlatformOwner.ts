import { auth } from "@clerk/nextjs/server";

export async function requirePlatformOwner(): Promise<string> {
  // ✅ await the promise
  const session = await auth();

  // TypeScript-safe check for userId
  const userId = "userId" in session && session.userId ? session.userId : undefined;

  if (!userId || userId !== process.env.PLATFORM_OWNER_CLERK_ID) {
    throw new Error("UNAUTHORIZED");
  }

  return userId; // explicitly typed as string
}
