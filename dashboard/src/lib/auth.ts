'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const TOKEN_NAME = 'auth_token'

export async function setAuthToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })
}

export async function clearAuthToken() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}

export async function getAuthToken() {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value
}

export async function logout() {
  await clearAuthToken()
  redirect('/login')
}
