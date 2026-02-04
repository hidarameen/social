import { NextRequest, NextResponse } from 'next/server'
import { db, type PlatformAccount } from '@/lib/db'
import { randomUUID } from 'crypto'
import { getAuthUser } from '@/lib/auth'
import { getClientKey, rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { parsePagination, parseSort } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const page = parsePagination(request.nextUrl.searchParams)
    if (!page.success) {
      return NextResponse.json({ success: false, error: 'Invalid pagination' }, { status: 400 })
    }
    const sort = parseSort(
      request.nextUrl.searchParams,
      ['createdAt', 'platformId', 'isActive', 'accountName'] as const,
      'createdAt'
    )
    if (!sort.success) {
      return NextResponse.json({ success: false, error: 'Invalid sort' }, { status: 400 })
    }
    const search = page.data.search
    const platformId = request.nextUrl.searchParams.get('platformId') || undefined
    const isActiveParam = request.nextUrl.searchParams.get('isActive')
    const isActive = isActiveParam === null ? undefined : isActiveParam === 'true'

    const result = await db.getUserAccountsPaged({
      userId: user.id,
      limit: page.data.limit,
      offset: page.data.offset,
      search,
      platformId,
      isActive,
      sortBy: sort.data.sortBy,
      sortDir: sort.data.sortDir,
    })
    
    return NextResponse.json({
      success: true,
      accounts: result.accounts,
      total: result.total,
      nextOffset: page.data.offset + result.accounts.length,
      hasMore: page.data.offset + result.accounts.length < result.total,
    })
  } catch (error) {
    console.error('[API] Error fetching accounts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const limiter = rateLimit(`accounts:post:${getClientKey(request)}`, 30, 60_000)
    if (!limiter.ok) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
    }
    const body = await request.json() as Partial<PlatformAccount>
    const user = await getAuthUser()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const schema = z.object({
      platformId: z.string().min(1),
      accountName: z.string().min(1),
      accountUsername: z.string().optional(),
      accountId: z.string().optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      credentials: z.record(z.any()).optional(),
      isActive: z.boolean().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }
    const safe = parsed.data

    const existing = (await db.getUserAccounts(user.id)).find(
      a => a.platformId === safe.platformId && a.accountId === safe.accountId
    )

    if (existing) {
      return NextResponse.json({ success: true, account: existing }, { status: 200 })
    }

    // Create account
    const account = await db.createAccount({
      id: randomUUID(),
      userId: user.id,
      platformId: safe.platformId,
      accountName: safe.accountName,
      accountUsername: safe.accountUsername ?? safe.accountName,
      accountId: safe.accountId ?? `${safe.platformId}_${Date.now()}`,
      accessToken: safe.accessToken ?? 'manual',
      refreshToken: safe.refreshToken,
      credentials: safe.credentials ?? {},
      isActive: safe.isActive ?? true,
    })

    return NextResponse.json({ success: true, account }, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
