import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/login',
  '/auth/sign-up',
  '/auth/sso',
  '/auth/sso-callback',
  '/auth/verify',
  '/auth/verify-signup',
  '/api/waitlist(.*)',
]);

function isAuthEntryPath(pathname: string) {
  if (pathname === '/auth/sso') return true;
  if (pathname === '/auth/login' || pathname.startsWith('/auth/login/')) return true;
  if (pathname === '/auth/sign-up' || pathname.startsWith('/auth/sign-up/')) return true;
  return false;
}

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (userId && isAuthEntryPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
