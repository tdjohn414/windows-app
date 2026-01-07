import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json({ products })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        unit: data.unit || 'ea',
        unitPrice: data.unitPrice,
        cost: data.cost || null,
        isActive: data.isActive ?? true,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
