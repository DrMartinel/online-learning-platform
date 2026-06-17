import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/profile', '/my-courses', '/learn', '/admin'];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('olp_session')?.value;
  const pathname = request.nextUrl.pathname;

  // 1. If logged in and trying to access auth or welcome pages, redirect to home
  if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/welcome')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. If not logged in and accessing root '/', redirect to welcome (landing page)
  if (!token && pathname === '/') {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  // 3. If not logged in and accessing protected paths, redirect to login
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
