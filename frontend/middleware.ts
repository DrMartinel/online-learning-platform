import { NextResponse, type NextRequest } from 'next/server';

// Routes that require a valid session
const PROTECTED_PATHS = ['/', '/profile', '/my-courses', '/learn', '/admin', '/courses', '/exams', '/exam-sessions'];

// Routes that logged-in users should NOT access (redirect to /courses)
const AUTH_ONLY_PATHS = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('olp_session')?.value;
  const pathname = request.nextUrl.pathname;

  // Logged-in users trying to access login/signup → redirect to courses
  if (token && AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/courses', request.url));
  }

  // Unauthenticated users trying to access protected routes → redirect to login
  const isProtected = PROTECTED_PATHS.some((p) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  );

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
