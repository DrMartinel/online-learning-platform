import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/profile', '/my-courses', '/learn', '/admin'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('olp_session')?.value;
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
