<script lang="ts">
  import type { CommentsResponse } from '@ytmod/shared'

  const API_BASE = import.meta.env.VITE_API_URL ?? 'https://ytmod-api.sandikodev.workers.dev'

  let videoInput = $state('')
  let loading = $state(false)
  let error = $state('')
  let result = $state<CommentsResponse | null>(null)

  function extractVideoId(input: string): string {
    try {
      const url = new URL(input)
      return url.searchParams.get('v') ?? url.pathname.split('/').pop() ?? input
    } catch {
      return input.trim()
    }
  }

  async function fetchComments() {
    if (!videoInput.trim()) return
    loading = true
    error = ''
    result = null

    const videoId = extractVideoId(videoInput)

    try {
      const res = await fetch(`${API_BASE}/comments?videoId=${videoId}&maxResults=100&order=time`)
      if (!res.ok) {
        const data = await res.json() as { error: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      result = await res.json() as CommentsResponse
    } catch (e) {
      error = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      loading = false
    }
  }

  function downloadCsv() {
    if (!result) return
    const header = 'id,author,text,likeCount,publishedAt,replyCount'
    const rows = result.comments.map(c =>
      [c.id, `"${c.author}"`, `"${c.text.replace(/"/g, '""')}"`, c.likeCount, c.publishedAt, c.replyCount ?? 0].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `comments-${result.videoId}.csv`
    a.click()
  }

  function downloadJson() {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `comments-${result.videoId}.json`
    a.click()
  }
</script>

<svelte:head>
  <title>YTMod — YouTube Comment Downloader</title>
</svelte:head>

<main>
  <h1>YouTube Comment Downloader</h1>
  <p class="subtitle">Unduh komentar YouTube dalam format CSV atau JSON</p>

  <form onsubmit={(e) => { e.preventDefault(); fetchComments() }}>
    <input
      type="text"
      bind:value={videoInput}
      placeholder="URL atau Video ID YouTube"
      aria-label="URL atau Video ID YouTube"
      disabled={loading}
    />
    <button type="submit" disabled={loading || !videoInput.trim()}>
      {loading ? 'Mengambil...' : 'Ambil Komentar'}
    </button>
  </form>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if result}
    <div class="result">
      <div class="result-header">
        <span>Ditemukan <strong>{result.totalComments.toLocaleString()}</strong> komentar</span>
        <div class="actions">
          <button onclick={downloadCsv}>Unduh CSV</button>
          <button onclick={downloadJson}>Unduh JSON</button>
        </div>
      </div>

      <ul class="comments">
        {#each result.comments as comment (comment.id)}
          <li>
            <div class="comment-meta">
              <strong>{comment.author}</strong>
              <time datetime={comment.publishedAt}>
                {new Date(comment.publishedAt).toLocaleDateString('id-ID')}
              </time>
              {#if comment.likeCount > 0}
                <span>👍 {comment.likeCount}</span>
              {/if}
            </div>
            <p>{comment.text}</p>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: system-ui, sans-serif;
  }

  h1 { margin-bottom: 0.25rem; }
  .subtitle { color: #666; margin-bottom: 2rem; }

  form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }

  button {
    padding: 0.6rem 1.2rem;
    background: #e00;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:disabled { opacity: 0.5; cursor: not-allowed; }

  .error { color: #c00; }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .actions { display: flex; gap: 0.5rem; }
  .actions button { background: #333; font-size: 0.875rem; }

  .comments {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .comments li {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }

  .comment-meta {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.4rem;
    font-size: 0.875rem;
    color: #555;
  }

  .comment-meta strong { color: #111; }
  .comments p { margin: 0; line-height: 1.5; }
</style>
