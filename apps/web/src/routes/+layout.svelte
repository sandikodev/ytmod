<script lang="ts">
  /**
   * Root layout — navigasi dan auth state global
   *
   * Token JWT disimpan di localStorage dengan key 'ytmod_token'.
   * Nav menampilkan email user jika login, atau link "Masuk" jika belum.
   * Logout menghapus token dan reload halaman.
   */

  import favicon from '$lib/assets/favicon.svg'
  import { base } from '$app/paths'

  let { children } = $props()

  // Baca email dari JWT payload (bagian tengah, base64url-encoded JSON)
  function getEmailFromToken(): string | null {
    if (typeof localStorage === 'undefined') return null
    const token = localStorage.getItem('ytmod_token')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      // Cek apakah token sudah expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem('ytmod_token')
        return null
      }
      return payload.email ?? null
    } catch {
      return null
    }
  }

  let userEmail = $state(getEmailFromToken())

  function logout() {
    localStorage.removeItem('ytmod_token')
    userEmail = null
    window.location.href = `${base}/`
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<nav>
  <div class="nav-links">
    <a href="{base}/">💬 Komentar</a>
    <a href="{base}/transcript">📝 Transcript</a>
    <a href="{base}/clipper">✂️ Clipper</a>
  </div>
  <div class="nav-auth">
    {#if userEmail}
      <span class="user-email">{userEmail}</span>
      <button class="logout-btn" onclick={logout}>Keluar</button>
    {:else}
      <a href="{base}/login">Masuk</a>
    {/if}
  </div>
</nav>

{@render children()}

<style>
  nav {
    max-width: 720px;
    margin: 1rem auto 0;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: system-ui, sans-serif;
    font-size: 0.9rem;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
  }

  nav a {
    color: #333;
    text-decoration: none;
    padding-bottom: 0.25rem;
    border-bottom: 2px solid transparent;
  }

  nav a:hover {
    border-color: #e00;
  }

  .nav-auth {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-email {
    color: #555;
    font-size: 0.8rem;
  }

  .logout-btn {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    font-size: 0.8rem;
    color: #555;
  }

  .logout-btn:hover {
    border-color: #e00;
    color: #e00;
  }
</style>
