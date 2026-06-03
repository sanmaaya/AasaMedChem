import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const userRole = token?.role;

  const isAdminRoute = pathname.startsWith('/admin');
  const isSellerRoute = pathname.startsWith('/seller');
  const isBuyerRoute = pathname.startsWith('/buyer');
  const isLoginRoute = pathname === '/login';
  const isRootRoute = pathname === '/';

  // Redirect for root route if logged in, otherwise show landing page
  if (isRootRoute) {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (userRole === 'seller') {
        return NextResponse.redirect(new URL('/seller/dashboard', req.url));
      } else if (userRole === 'buyer') {
        return NextResponse.redirect(new URL('/buyer/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // Redirect for login route if already logged in
  if (isLoginRoute) {
    if (isLoggedIn) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (userRole === 'seller') {
        return NextResponse.redirect(new URL('/seller/dashboard', req.url));
      } else if (userRole === 'buyer') {
        return NextResponse.redirect(new URL('/buyer/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // Enforce access control
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
