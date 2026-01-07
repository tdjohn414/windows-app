import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, companyName, companyPhone, companyAddress } = await request.json()

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Email, password, and company name are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        companyName,
        companyPhone: companyPhone || null,
        companyAddress: companyAddress || null,
      },
    })

    const token = generateToken(user.id)
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
