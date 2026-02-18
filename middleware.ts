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
    "/api/webhooks/intasend",
  ];

  if (publicApiRoutes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const publicPaths = ["/", "/pricing", "/b"];
  const authPages = ["/sign-in", "/sign-up"];
  const setupPath = "/setup";

  const isPublicBooking = pathname.startsWith("/b/");
  const isPublic =
    publicPaths.includes(pathname) || isPublicBooking;

  const isAuthPage = authPages.some((p) => pathname.startsWith(p));
  const isSetup = pathname.startsWith(setupPath);

  if (!userId) {
    if (!isPublic && !isAuthPage && !isSetup) {
      const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;
      url.pathname = "/sign-in";
      url.searchParams.set("redirect_url", redirectUrl);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});
