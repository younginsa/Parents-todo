import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/api/auth/(.*)",
  "/api/health",
]);

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (ALLOWED_EMAILS.length > 0) {
    const email =
      (sessionClaims?.email as string | undefined)?.toLowerCase() ??
      (sessionClaims?.primaryEmailAddress as string | undefined)?.toLowerCase();

    if (!email || !ALLOWED_EMAILS.includes(email)) {
      const denied = new URL("/login", req.url);
      denied.searchParams.set("reason", "not-invited");
      return NextResponse.redirect(denied);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
