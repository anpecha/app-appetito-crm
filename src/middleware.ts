import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

function stripLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0 && (routing.locales as readonly string[]).includes(segments[0])) {
    return '/' + segments.slice(1).join('/')
  }
  return pathname
}

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request)

  if (intlResponse.status !== 200) {
    return intlResponse
  }

  const locale = request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale
  const isRewrite = intlResponse.headers.has('x-middleware-rewrite')

  let supabaseResponse = intlResponse

  if (isRewrite) {
    request.headers.set('X-NEXT-INTL-LOCALE', locale)
    supabaseResponse = NextResponse.next({ request })
    for (const cookie of intlResponse.cookies.getAll()) {
      supabaseResponse.cookies.set(cookie.name, cookie.value)
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = stripLocale(request.nextUrl.pathname)

  if (user && (path === '/' || path === '/login' || path === '/signup' || path === '/forgot-password')) {
    const url = request.nextUrl.clone()
    url.pathname = path === request.nextUrl.pathname ? '/dashboard' : request.nextUrl.pathname.replace(/\/[^/]+/, '') + '/dashboard'
    return NextResponse.redirect(url)
  }

  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings', '/admin', '/billing', '/onboarding']
  if (!user && protectedPaths.some(p => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = path === request.nextUrl.pathname ? '/login' : request.nextUrl.pathname.replace(/\/[^/]+/, '') + '/login'
    return NextResponse.redirect(url)
  }

  if (!user && path.startsWith('/api/whatsapp/') && !path.includes('/webhook')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
