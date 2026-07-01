import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'
const POTENCIALIZADOR_URL = process.env.POTENCIALIZADOR_API_URL || 'http://127.0.0.1:8001'
const ROBO_URL = process.env.ROBO_API_URL || 'http://127.0.0.1:8002'
const CARTAODIGITAL_URL = process.env.CARTAODIGITAL_API_URL || 'http://127.0.0.1:8003'

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let targetUrl: URL

  if (pathSegments[0] === 'services' && pathSegments[1] === 'potencializador') {
    const microPath = pathSegments.slice(1).join('/')
    targetUrl = new URL(`/${microPath}`, POTENCIALIZADOR_URL)
  } else if (pathSegments[0] === 'services' && pathSegments[1] === 'robo') {
    const microPath = pathSegments.slice(1).join('/')
    targetUrl = new URL(`/${microPath}`, ROBO_URL)
  } else if (pathSegments[0] === 'services' && pathSegments[1] === 'cardapiodigital') {
    const microPath = pathSegments.slice(1).join('/')
    targetUrl = new URL(`/${microPath}`, CARTAODIGITAL_URL)
  } else {
    targetUrl = new URL(`/api/v1/${pathSegments.join('/')}`, BACKEND_URL)
  }

  targetUrl.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.set('X-User-Id', user.id)

  try {
    let requestBody: ArrayBuffer | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestBody = await request.arrayBuffer()
    }

    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: requestBody,
      redirect: 'follow',
    })

    const responseBody = await backendResponse.arrayBuffer()
    const proxyHeaders = new Headers(backendResponse.headers)
    proxyHeaders.delete('content-encoding')

    if (!backendResponse.ok) {
      const errorText = new TextDecoder().decode(responseBody)
      console.error('Proxy error:', backendResponse.status, errorText)
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: proxyHeaders,
    })
  } catch (error) {
    console.error('Proxy fetch error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', detail: String(error) },
      { status: 500 }
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
