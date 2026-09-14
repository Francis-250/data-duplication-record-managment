import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { roleForPath, roleHome } from "@/lib/auth-routing";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const pathname = request.nextUrl.pathname;
  const requiredRole = roleForPath(pathname);
  const authEntry = pathname === "/auth/login" || pathname === "/auth/register";
  const isPageRequest = request.method === "GET" || request.method === "HEAD";

  if (!session?.user) {
    if (requiredRole) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next();
  }

  const home = roleHome(session.user.role);

  if (authEntry && isPageRequest) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (requiredRole && session.user.role?.toLowerCase() !== requiredRole) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
