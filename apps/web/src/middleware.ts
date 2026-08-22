import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret, SESSION_COOKIE, TOKEN_ISSUER } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  let hasValidSession = false;
  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, getJwtSecret(), {
        algorithms: ["HS256"],
        issuer: TOKEN_ISSUER,
        audience: "session",
      });
      hasValidSession = true;
    } catch {
      hasValidSession = false;
    }
  }

  if (isDashboardRoute && !hasValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
