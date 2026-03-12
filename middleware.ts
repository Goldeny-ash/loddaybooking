import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;

  // 1️⃣ skip _next and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/animations")
  ) {
    return NextResponse.next();
  }

  // ✅ PUBLIC API ROUTES FOR PAYMENTS
  const publicApiRoutes = [
    "/api/bookings/deposit/callback",
    "/api/bookings/deposit/status",
    "/api/bookings/reschedule",
    "/api/bookings/cancel",
    "/api/reviews",
    "/api/reviews/context",
    "/api/webhooks/intasend",
    "/api/intasend/send-money-webhook",
    "/api/cron/run",
  ];

  if (publicApiRoutes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const publicPaths = ["/", "/pricing", "/b", "/sitemap.xml", "/robots.txt"];
  const authPages = ["/sign-in", "/sign-up"];
  const setupPath = "/setup";
  const isReviewPage = pathname === "/review" || pathname.startsWith("/review/");

  const isPublicBooking =
    /^\/b\/[^/]+(?:\/.*)?$/.test(pathname) || pathname.startsWith("/b/");
  const isPublic =
    publicPaths.includes(pathname) || isPublicBooking || isReviewPage;

  const isAuthPage = authPages.some((p) => pathname.startsWith(p));
  const isSetup = pathname.startsWith(setupPath);
  const isApiRoute = pathname.startsWith("/api/");

  if (!userId) {
    if (!isPublic && !isAuthPage && !isSetup) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;
      url.pathname = "/sign-in";
      url.searchParams.set("redirect_url", redirectUrl);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
