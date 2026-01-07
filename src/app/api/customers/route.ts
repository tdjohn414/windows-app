import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { estimates: true } }
    }
  })

  return NextResponse.json({ customers })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
