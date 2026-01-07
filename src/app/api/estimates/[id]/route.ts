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

  const estimate = await prisma.estimate.findFirst({
    where: { id: parseInt(id), userId: user.id },
    include: {
      customer: true,
      lineItems: {
        orderBy: { sortOrder: 'asc' },
        include: { product: true }
      },
      user: {
        select: {
          companyName: true,
          companyAddress: true,
          companyPhone: true,
          companyEmail: true,
          logoUrl: true,
        }
      }
    },
  })

  if (!estimate) {
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  }

  return NextResponse.json({ estimate })
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

    // Check ownership
    const existing = await prisma.estimate.findFirst({
      where: { id: parseInt(id), userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Calculate totals if line items provided
    let updateData: any = {
      status: data.status,
      jobStatus: data.jobStatus,
      jobAddress: data.jobAddress || null,
      jobCity: data.jobCity || null,
      jobState: data.jobState || null,
      jobZip: data.jobZip || null,
      notes: data.notes || null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      completedDate: data.completedDate ? new Date(data.completedDate) : null,
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
    }

    if (data.lineItems) {
      const lineItems = data.lineItems
      const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      const taxRate = data.taxRate || 0
      const taxAmount = subtotal * (taxRate / 100)
      const total = subtotal + taxAmount

      updateData = {
        ...updateData,
        subtotal,
        taxRate,
        taxAmount,
        total,
      }

      // Delete existing line items and create new ones
      await prisma.estimateLineItem.deleteMany({
        where: { estimateId: parseInt(id) },
      })

      await prisma.estimateLineItem.createMany({
        data: lineItems.map((item: any, index: number) => ({
          estimateId: parseInt(id),
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'ea',
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: index,
        })),
      })
    }

    const estimate = await prisma.estimate.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('Update estimate error:', error)
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 })
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
    await prisma.estimate.deleteMany({
      where: { id: parseInt(id), userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete estimate error:', error)
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 })
  }
}
