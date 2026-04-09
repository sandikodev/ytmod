/**
 * Auth helper — dipakai oleh halaman yang butuh token
 *
 * Mengambil token dari localStorage dan menyediakan helper
 * untuk fetch dengan Authorization header.
 */

import { goto } from '$app/navigation'
import { base } from '$app/paths'

/** Ambil token dari localStorage, redirect ke /login jika tidak ada */
export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('ytmod_token')
}

/** Redirect ke /login jika belum login */
export function requireAuth(): string {
  const token = getToken()
  if (!token) {
    goto(`${base}/login`)
    return ''
  }
  return token
}

/** Fetch dengan Authorization header — otomatis sertakan JWT */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
