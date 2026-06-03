import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

function dashboardForRole(role: string | undefined): string | null {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'seller') return '/seller/dashboard';
  if (role === 'buyer') return '/buyer/dashboard';
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: authSecret,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  const isAdminRoute = pathname.startsWith('/admin');
  const isSellerRoute = pathname.startsWith('/seller');
  const isBuyerRoute = pathname.startsWith('/buyer');
  const isLoginRoute = pathname === '/login';
  const isRootRoute = pathname === '/';

  if (isRootRoute || isLoginRoute) {
    if (isLoggedIn) {
      const dashboard = dashboardForRole(userRole);
      if (dashboard) {
        return NextResponse.redirect(new URL(dashboard, req.url));
      }
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isAdminRoute || isSellerRoute || isBuyerRoute) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isSellerRoute && userRole !== 'seller') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isBuyerRoute && userRole !== 'buyer') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/seller/:path*',
    '/buyer/:path*',
  ],
};
