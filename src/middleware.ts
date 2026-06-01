import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PATHS = [
  "/dashboard",
  "/crm",
  "/projects",
  "/finances",
  "/suppliers",
  "/ai",
];

const AUTH_PATHS = ["/login", "/register"];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const isLoggedIn = Boolean(token);

  const isProtected = PROTECTED_PATHS.some((p) =>
    nextUrl.pathname.startsWith(p),
  );
  const isAuthPage = AUTH_PATHS.includes(nextUrl.pathname);

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
