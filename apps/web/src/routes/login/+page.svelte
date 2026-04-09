<script lang="ts">
  /**
   * Login page — /login
   *
   * Mekanisme auth: token-based sederhana.
   * User memasukkan token secara manual, disimpan ke localStorage key 'ytmod_token'.
   * Tidak ada registrasi — token diperoleh dari backend secara out-of-band.
   *
   * Setelah login berhasil, redirect ke halaman sebelumnya (history.back())
   * atau ke '/' jika tidak ada history.
   */

  import { base } from '$app/paths'

  let token = $state('')
  let error = $state('')

  function login() {
    error = ''

    // Validasi: token tidak boleh kosong sebelum disimpan
    if (!token.trim()) {
      error = 'Token tidak boleh kosong'
      return
    }

    localStorage.setItem('ytmod_token', token.trim())

    // Kembali ke halaman sebelumnya jika ada, fallback ke root
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = `${base}/`
    }
  }
</script>

<svelte:head>
  <title>YTMod — Login</title>
</svelte:head>

<main>
  <h1>Masuk</h1>
  <p class="desc">Masukkan token akses untuk menggunakan ytmod.</p>

  <form
    onsubmit={(e) => {
      e.preventDefault()
      login()
    }}
  >
    <label for="token">Token</label>
    <input
      id="token"
      type="password"
      bind:value={token}
      placeholder="Paste token di sini"
      autocomplete="current-password"
    />
    <button type="submit">Masuk</button>
  </form>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</main>

<style>
  main {
    max-width: 360px;
    margin: 4rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
  }

  h1 {
    margin-bottom: 0.5rem;
  }

  .desc {
    color: #555;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #333;
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

  button:hover {
    background: #c00;
  }

  .error {
    color: #c00;
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }
</style>
