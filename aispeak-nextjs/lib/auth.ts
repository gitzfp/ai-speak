import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
  sub: string // user id
  role: string
  iat: number
  exp: number
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { 
      sub: userId, 
      role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export async function getCurrentUserId(): Promise<string | null> {
  const headersList = headers()
  const authorization = headersList.get('authorization')
  
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authorization.slice(7)
  const payload = verifyToken(token)
  
  return payload?.sub || null
}

export async function getCurrentUser(): Promise<{ id: string; role: string } | null> {
  const headersList = headers()
  const authorization = headersList.get('authorization')
  
  if (!authorization?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authorization.slice(7)
  const payload = verifyToken(token)
  
  if (!payload) {
    return null
  }
  
  return {
    id: payload.sub,
    role: payload.role
  }
}

export function requireAuth() {
  return async (req: Request) => {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }
    return user
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (req: Request) => {
    const user = await getCurrentUser()
    if (!user || !allowedRoles.includes(user.role)) {
      throw new Error('Forbidden')
    }
    return user
  }
} 