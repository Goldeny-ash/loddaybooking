import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const MARKETPLACE_HOSTS = new Set([
  "lodday.com",
  "www.lodday.com",
  "marketplace.lodday.com",
]);

function normalizeHost(value: string) {
  return value.replace(/:\d+$/, "").toLowerCase();
}

function getInternalPathname(hostname: string, pathname: string) {
  if (MARKETPLACE_HOSTS.has(hostname)) {
    return pathname === "/" ? "/marketplace" : `/marketplace${pathname}`;
  }

  if (hostname === "affiliates.lodday.com") {
    return pathname === "/" ? "/affiliates" : `/affiliates${pathname}`;
  }

  if (hostname === "admin.lodday.com" && pathname === "/") {
    return "/dashboard";
  }

  return pathname;
}

function getCanonicalHost(internalPathname: string, hostname: string) {
  if (internalPathname === "/affiliates" || internalPathname.startsWith("/affiliates/")) {
    return "affiliates.lodday.com";
  }

  if (internalPathname === "/marketplace" || internalPathname.startsWith("/marketplace/")) {
    return "lodday.com";
  }

  if (hostname === "admin.lodday.com") {
    return "admin.lodday.com";
  }

  return "booking.lodday.com";
}

function getPublicPathname(internalPathname: string, canonicalHost: string) {
  if (canonicalHost === "lodday.com") {
    return internalPathname.replace(/^\/marketplace/, "") || "/";
  }

  if (canonicalHost === "affiliates.lodday.com") {
    return internalPathname.replace(/^\/affiliates/, "") || "/";
  }

  return internalPathname;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const hostname = normalizeHost(hostHeader);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/animations")
  ) {
    return NextResponse.next();
  }

  const internalPathname = getInternalPathname(hostname, pathname);
  const canonicalHost = getCanonicalHost(internalPathname, hostname);

  if (
    hostname &&
    hostname !== canonicalHost &&
    hostname.endsWith("lodday.com")
  ) {
    url.hostname = canonicalHost;
    url.pathname = getPublicPathname(internalPathname, canonicalHost);
    return NextResponse.redirect(url);
  }

  const publicApiRouteMatchers = [
    (path: string) => path === "/api/availability",
    (path: string) => path === "/api/portfolio/link",
    (path: string) => path === "/api/bookings/public",
    (path: string) => path === "/api/bookings/manage",
    (path: string) => path === "/api/bookings/reschedule",
    (path: string) => path === "/api/bookings/cancel",
    (path: string) => path === "/api/bookings/resend-email",
    (path: string) => path === "/api/bookings/deposit/initiate",
    (path: string) => path === "/api/bookings/deposit/callback",
    (path: string) => path === "/api/bookings/deposit/status",
    (path: string) => /^\/api\/bookings\/[^/]+\/complete$/.test(path),
    (path: string) => path.startsWith("/api/reviews"),
    (path: string) => path === "/api/reviews/context",
    (path: string) => path === "/api/webhooks/intasend",
    (path: string) => path === "/api/intasend/send-money-webhook",
    (path: string) => path === "/api/cron/run",
  ];

  if (publicApiRouteMatchers.some((matches) => matches(pathname))) {
    return NextResponse.next();
  }

  const publicPaths = ["/", "/pricing", "/b", "/sitemap.xml", "/robots.txt"];
  const authPages = ["/sign-in", "/sign-up"];
  const setupPath = "/setup";
  const isReviewPage = internalPathname === "/review" || internalPathname.startsWith("/review/");
  const isMarketplacePage =
    internalPathname === "/marketplace" || internalPathname.startsWith("/marketplace/");
  const isAffiliatePage =
    internalPathname === "/affiliates" || internalPathname.startsWith("/affiliates/");

  const isPublicBooking =
    /^\/b\/[^/]+(?:\/.*)?$/.test(internalPathname) || internalPathname.startsWith("/b/");
  const isPublic =
    publicPaths.includes(internalPathname) ||
    isPublicBooking ||
    isReviewPage ||
    isMarketplacePage ||
    isAffiliatePage;

  const isAuthPage = authPages.some((p) => internalPathname.startsWith(p));
  const isSetup = internalPathname.startsWith(setupPath);
  const isApiRoute = internalPathname.startsWith("/api/");

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

  if (internalPathname !== pathname) {
    url.pathname = internalPathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
