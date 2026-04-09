/**
 * Auth helper — dipakai oleh halaman yang butuh token
 *
 * Mekanisme auth: token-based, disimpan di localStorage key 'ytmod_token'.
 * Token diisi manual via halaman /login — tidak ada registrasi otomatis.
 * Di SSR (server-side rendering), localStorage tidak tersedia sehingga
 * semua fungsi gracefully return null/empty tanpa throw.
 */

import { goto } from '$app/navigation'
import { base } from '$app/paths'

/**
 * Ambil token dari localStorage.
 *
 * Behavior SSR: `typeof localStorage === 'undefined'` saat dijalankan di server
 * (SvelteKit SSR / prerender), sehingga return null tanpa mencoba akses localStorage.
 * Key yang dipakai: 'ytmod_token'.
 *
 * @returns Token string jika ada, null jika SSR atau token belum di-set.
 */
export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('ytmod_token')
}

/**
 * Pastikan user sudah login sebelum mengakses halaman yang dilindungi.
 *
 * Mengapa redirect (bukan throw): SvelteKit tidak bisa throw di client-side
 * navigation — redirect via `goto()` adalah cara yang benar untuk memaksa
 * user ke halaman login tanpa merusak state aplikasi.
 *
 * Side effect: memanggil `goto(`${base}/login`)` jika token tidak ada.
 * Return '' saat SSR atau saat redirect terjadi — caller harus cek nilai
 * sebelum dipakai.
 *
 * @returns Token string jika sudah login, '' jika SSR atau belum login (redirect terjadi).
 */
export function requireAuth(): string {
  const token = getToken()
  if (!token) {
    goto(`${base}/login`)
    return ''
  }
  return token
}

/**
 * Wrapper `fetch` yang otomatis menyertakan Authorization header.
 *
 * Jika token tersedia di localStorage, header `Authorization: Bearer {token}`
 * ditambahkan ke setiap request. Jika tidak ada token (SSR atau belum login),
 * fetch tetap dikirim tanpa Authorization header — server akan menolak dengan 401.
 *
 * @param url - URL tujuan request
 * @param options - RequestInit options (method, body, headers, dll) — di-merge dengan auth header
 * @returns Promise<Response> dari fetch
 */
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
