<script lang="ts">
  /**
   * Login page — /login
   *
   * Mengirim credentials ke POST /auth/login, menyimpan JWT ke localStorage,
   * lalu redirect ke halaman utama.
   */

  import { goto } from '$app/navigation'
  import { base } from '$app/paths'

  const API_BASE = import.meta.env.VITE_API_URL
  if (!API_BASE) throw new Error('VITE_API_URL is not set')

  let email = $state('')
  let password = $state('')
  let loading = $state(false)
  let error = $state('')

  async function login() {
    loading = true
    error = ''
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { token: string }
      localStorage.setItem('ytmod_token', data.token)
      goto(`${base}/`)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>YTMod — Login</title>
</svelte:head>

<main>
  <h1>Login</h1>

  <form
    onsubmit={(e) => {
      e.preventDefault()
      login()
    }}
  >
    <input type="email" bind:value={email} placeholder="Email" required disabled={loading} />
    <input
      type="password"
      bind:value={password}
      placeholder="Password"
      required
      disabled={loading}
    />
    <button type="submit" disabled={loading || !email || !password}>
      {loading ? 'Masuk...' : 'Masuk'}
    </button>
  </form>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <p class="link">Belum punya akun? <a href="{base}/register">Daftar</a></p>
</main>

<style>
  main {
    max-width: 360px;
    margin: 4rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
  }
  h1 {
    margin-bottom: 1.5rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  input {
    padding: 0.6rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }
  button {
    padding: 0.7rem;
    background: #e00;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .error {
    color: #c00;
    margin-top: 0.5rem;
  }
  .link {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #555;
  }
</style>
