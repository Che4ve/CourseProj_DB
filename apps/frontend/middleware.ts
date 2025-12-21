import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;

  // Check if user is authenticated
  let isAuthenticated = false;
  if (token) {
    try {
      // Decode and verify JWT without making network calls
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch {
      // Token is invalid or expired
      isAuthenticated = false;
    }
  }

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // Redirect to login if not authenticated and trying to access protected routes
  if (!isAuthenticated && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
