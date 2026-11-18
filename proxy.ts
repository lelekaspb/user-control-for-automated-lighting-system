import { NextResponse, type NextRequest } from "next/server";
import { getAuthMode, isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

// Redirects to /login when AUTH_MODE=protect-all. Server Actions still check
// access themselves (requireCommandAccess), so this is not the only barrier.
export async function proxy(request: NextRequest) {
  if (getAuthMode() !== "protect-all") return NextResponse.next();
  if (request.nextUrl.pathname === "/login") return NextResponse.next();

  if (await isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
