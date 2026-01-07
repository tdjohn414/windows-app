import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id: parseInt(id), userId: user.id },
    include: {
      estimates: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      }
    }
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  return NextResponse.json({ customer })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    const customer = await prisma.customer.updateMany({
      where: { id: parseInt(id), userId: user.id },
      data: {
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

    if (customer.count === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await prisma.customer.deleteMany({
      where: { id: parseInt(id), userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
