import { NextResponse } from "next/server";
import { ADMIN_ELEVATION_COOKIE, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const loginUrl = new URL("/login", requestUrl.origin);
  
  const response = NextResponse.redirect(loginUrl);
  
  // Explicitly clear session and admin cookies on the response object
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(ADMIN_ELEVATION_COOKIE, "", { path: "/admin", maxAge: 0 });
  
  return response;
}
