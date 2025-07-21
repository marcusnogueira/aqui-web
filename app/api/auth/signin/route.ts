import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, name } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
  }

  const supabase = createClient()

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('email', email)
    .single()

  if (existingUser) {
    // Validate password
    const isValid = await bcrypt.compare(password, existingUser.password_hash || '')
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: 'Logged in' }, { status: 200 })
  }

  // Create new user
  const hashedPassword = await bcrypt.hash(password, 12)
  const id = crypto.randomUUID()

  const { error: createError } = await supabase
    .from('users')
    .insert({
      id,
      email,
      full_name: name || email.split('@')[0],
      password_hash: hashedPassword,
      active_role: 'customer',
    })

  if (createError) {
    console.error('Error creating user:', createError)
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'User created' }, { status: 201 })
}
