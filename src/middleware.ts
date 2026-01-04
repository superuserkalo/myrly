import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/pricing",
  "/quiz",
]);

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isTokenImageRoute = createRouteMatcher([
  "/api/generate-qwen-image(.*)",
  "/api/generate-qwen-edit(.*)",
  "/api/generate-seedream-edit(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (
    isTokenImageRoute(req) &&
    (req.method === "GET" || req.method === "HEAD") &&
    req.nextUrl.searchParams.has("token")
  ) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const pathname = req.nextUrl.pathname;

  if (userId) {
    const onboardingFlag = sessionClaims?.metadata?.onboarding_complete;
    const onboardingComplete =
      onboardingFlag === true || onboardingFlag === "true";

    if (!onboardingComplete && !isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    if (onboardingComplete) {
      if (isOnboardingRoute(req) || isAuthRoute(req) || pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  }

  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
