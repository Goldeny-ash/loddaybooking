import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSubdomain, isLoddaySubdomainHost, normalizeHost } from "@/lib/subdomain";

const MARKETPLACE_HOSTS = new Set([
  "lodday.com",
  "www.lodday.com",
  "marketplace.lodday.com",
]);
const AFFILIATE_HOSTS = new Set(["affiliates.lodday.com"]);
const BOOKING_HOSTS = new Set(["booking.lodday.com"]);
const ADMIN_HOSTS = new Set(["admin.lodday.com"]);
const BLOG_HOSTS = new Set(["blog.lodday.com"]);

function isKnownLoddayHost(hostname: string) {
  return (
    MARKETPLACE_HOSTS.has(hostname) ||
    AFFILIATE_HOSTS.has(hostname) ||
    BOOKING_HOSTS.has(hostname) ||
    ADMIN_HOSTS.has(hostname) ||
    BLOG_HOSTS.has(hostname)
  );
}

function getInternalPathname(hostname: string, pathname: string) {
  if (isLoddaySubdomainHost(hostname) && !isKnownLoddayHost(hostname)) {
    const subdomain = getSubdomain(hostname);
    if (subdomain) {
      return pathname === "/" ? `/b/${subdomain}` : `/b/${subdomain}${pathname}`;
    }
  }

  if (MARKETPLACE_HOSTS.has(hostname)) {
    return pathname === "/" ? "/marketplace" : `/marketplace${pathname}`;
  }

  if (AFFILIATE_HOSTS.has(hostname)) {
    return pathname === "/" ? "/affiliates" : `/affiliates${pathname}`;
  }

 if (ADMIN_HOSTS.has(hostname)) {
  return pathname === "/" ? "/admin" : `/admin${pathname}`;
}

 if (BLOG_HOSTS.has(hostname)) {
  return pathname === "/" ? "/blg" : `/blg${pathname}`;
 }

  return pathname;
}

function getCanonicalHost(internalPathname: string, hostname: string) {
  if (internalPathname === "/affiliates" || internalPathname.startsWith("/affiliates/")) {
    return "affiliates.lodday.com";
  }

  if (internalPathname === "/marketplace" || internalPathname.startsWith("/marketplace/")) {
    return "marketplace.lodday.com";
  }

 if (internalPathname === "/admin" || internalPathname.startsWith("/admin/")) {
  return "admin.lodday.com";
}

 if (internalPathname === "/blg" || internalPathname.startsWith("/blg/")) {
  return "blog.lodday.com";
 }

  if (BOOKING_HOSTS.has(hostname)) {
    return "booking.lodday.com";
  }

  if (isLoddaySubdomainHost(hostname) && !isKnownLoddayHost(hostname)) {
    return hostname;
  }

  if (isKnownLoddayHost(hostname)) {
    return hostname;
  }

  return hostname;
}

function getPublicPathname(internalPathname: string, canonicalHost: string) {
  if (canonicalHost === "marketplace.lodday.com") {
    return internalPathname.replace(/^\/marketplace/, "") || "/";
  }

  if (canonicalHost === "affiliates.lodday.com") {
    return internalPathname.replace(/^\/affiliates/, "") || "/";
  }
if (canonicalHost === "admin.lodday.com") {
  return internalPathname.replace(/^\/admin/, "") || "/";
}
 if (canonicalHost === "blog.lodday.com") {
  return internalPathname.replace(/^\/blg/, "") || "/";
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
    hostname === "admin.lodday.com" &&
    pathname.startsWith("/admin/")
  ) {
    url.pathname = pathname.replace(/^\/admin/, "") || "/";
    return NextResponse.redirect(url);
  }
  // ✅ CLEAN marketplace double prefix
if (
  hostname === "marketplace.lodday.com" &&
  pathname.startsWith("/marketplace/")
) {
  const url = req.nextUrl.clone();
  url.pathname = pathname.replace(/^\/marketplace/, "") || "/";
  return NextResponse.redirect(url);
}
if (
  hostname === "blog.lodday.com" &&
  pathname.startsWith("/blg/")
) {
  const url = req.nextUrl.clone();
  url.pathname = pathname.replace(/^\/blg/, "") || "/";
  return NextResponse.redirect(url);
}
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/animations")
  ) {
    return NextResponse.next();
  }
// ✅ ADD THIS BLOCK
if (pathname.startsWith("/api")) {
  return NextResponse.next();
}
  const internalPathname = getInternalPathname(hostname, pathname);
  const canonicalHost = getCanonicalHost(internalPathname, hostname);

  if (
    hostname &&
    hostname !== canonicalHost &&
    isKnownLoddayHost(hostname)
  ) {
    url.host = canonicalHost;
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
  const isBlogPage =
    internalPathname === "/blg" || internalPathname.startsWith("/blg/");

  const isPublicBooking =
    /^\/b\/[^/]+(?:\/.*)?$/.test(internalPathname) || internalPathname.startsWith("/b/");
  const isPublic =
    publicPaths.includes(internalPathname) ||
    isPublicBooking ||
    isReviewPage ||
    isMarketplacePage ||
    isAffiliatePage ||
    isBlogPage;

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
