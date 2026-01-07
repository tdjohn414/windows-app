import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, generateEstimateNumber } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const jobStatus = searchParams.get('jobStatus')

  const where: any = { userId: user.id }
  if (status) where.status = status
  if (jobStatus) where.jobStatus = jobStatus

  const estimates = await prisma.estimate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      lineItems: {
        orderBy: { sortOrder: 'asc' }
      },
    },
  })

  return NextResponse.json({ estimates })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Calculate totals
    const lineItems = data.lineItems || []
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const taxRate = data.taxRate || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const estimate = await prisma.estimate.create({
      data: {
        userId: user.id,
        customerId: data.customerId,
        estimateNumber: generateEstimateNumber(),
        status: data.status || 'draft',
        jobStatus: data.jobStatus || 'quote',
        jobAddress: data.jobAddress || null,
        jobCity: data.jobCity || null,
        jobState: data.jobState || null,
        jobZip: data.jobZip || null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: data.notes || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        lineItems: {
          create: lineItems.map((item: any, index: number) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'ea',
            unitPrice: item.unitPrice,
            total: item.total,
            sortOrder: index,
          })),
        },
      },
      include: {
        customer: true,
        lineItems: true,
      },
    })

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('Create estimate error:', error)
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 })
  }
}
