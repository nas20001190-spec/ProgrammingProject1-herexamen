import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const publiekeRoutes = [
  '/authentificator/login',
  '/authentificator/wachtwoord-vergeten',
  '/authentificator/first-time',
]

const ROUTE_ROLES = {
  '/student': 'student',
  '/docent': 'docent',
  '/stagementor': 'stagementor',
  '/admin': 'admin',
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (publiekeRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/authentificator/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const prefix = Object.keys(ROUTE_ROLES).find(p => pathname.startsWith(p))
    if (prefix && payload.rol !== ROUTE_ROLES[prefix]) {
      return NextResponse.redirect(new URL('/authentificator/login', request.url))
    }
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/authentificator/login', request.url))
  }
}

export const config = {
  matcher: ['/student/:path*', '/docent/:path*', '/stagementor/:path*', '/admin/:path*'],
}