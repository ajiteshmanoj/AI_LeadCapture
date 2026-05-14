import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Forward the request pathname as a header so server components
// (specifically getCurrentOrgOrRedirect) can read it without depending on
// the Next.js internal URL APIs, which are unavailable in some rendering contexts.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
