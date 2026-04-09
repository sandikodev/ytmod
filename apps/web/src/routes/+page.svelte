<script lang="ts">
  import type { Comment, CommentsResponse } from '@ytmod/shared'

  const API_BASE = import.meta.env.VITE_API_URL
  if (!API_BASE) throw new Error('VITE_API_URL is not set')

  let videoInput = $state('')
  let loading = $state(false)
  let loadingMore = $state(false)
  let error = $state('')

  // result metadata (title, total)
  let result = $state<Pick<CommentsResponse, 'videoId' | 'videoTitle' | 'totalComments'> | null>(
    null
  )
  let allComments = $state<Comment[]>([])
  let nextPageToken = $state<string | undefined>(undefined)

  // filter controls
  let order = $state<'time' | 'relevance'>('relevance')
  let maxResults = $state(20)

  function extractVideoId(input: string): string {
    try {
      const url = new URL(input)
      return url.searchParams.get('v') ?? url.pathname.split('/').pop() ?? input
    } catch {
      return input.trim()
    }
  }

  function buildUrl(videoId: string, pageToken?: string) {
    const params = new URLSearchParams({
      videoId,
      maxResults: String(maxResults),
      order,
      ...(pageToken ? { pageToken } : {}),
    })
    return `${API_BASE}/comments?${params}`
  }

  async function fetchComments() {
    if (!videoInput.trim()) return
    loading = true
    error = ''
    result = null
    allComments = []
    nextPageToken = undefined

    const videoId = extractVideoId(videoInput)
    try {
      const res = await fetch(buildUrl(videoId))
      if (!res.ok) {
        const data = (await res.json()) as { error: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as CommentsResponse
      result = {
        videoId: data.videoId,
        videoTitle: data.videoTitle,
        totalComments: data.totalComments,
      }
      allComments = data.comments
      nextPageToken = data.nextPageToken
    } catch (e) {
      error = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      loading = false
    }
  }

  async function loadMore() {
    if (!result || !nextPageToken) return
    loadingMore = true
    try {
      const res = await fetch(buildUrl(result.videoId, nextPageToken))
      if (!res.ok) {
        const data = (await res.json()) as { error: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as CommentsResponse
      allComments = [...allComments, ...data.comments]
      nextPageToken = data.nextPageToken
    } catch (e) {
      error = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      loadingMore = false
    }
  }

  function downloadCsv() {
    if (!allComments.length) return
    const header = 'id,author,text,likeCount,publishedAt,replyCount'
    const rows = allComments.map((c) =>
      [
        c.id,
        `"${c.author}"`,
        `"${c.text.replace(/"/g, '""')}"`,
        c.likeCount,
        c.publishedAt,
        c.replyCount ?? 0,
      ].join(',')
    )
    download([header, ...rows].join('\n'), `comments-${result?.videoId}.csv`, 'text/csv')
  }

  function downloadJson() {
    if (!allComments.length) return
    download(
      JSON.stringify({ ...result, comments: allComments }, null, 2),
      `comments-${result?.videoId}.json`,
      'application/json'
    )
  }

  function download(content: string, filename: string, type: string) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = filename
    a.click()
  }
</script>

<svelte:head>
  <title>YTMod — YouTube Comment Downloader</title>
</svelte:head>

<main>
  <h1>YouTube Comment Downloader</h1>
  <p class="subtitle">Unduh komentar YouTube dalam format CSV atau JSON</p>

  <form
    onsubmit={(e) => {
      e.preventDefault()
      fetchComments()
    }}
  >
    <div class="input-row">
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
    </div>

    <div class="filter-row">
      <label>
        Urutan
        <select bind:value={order} disabled={loading}>
          <option value="relevance">Paling Relevan</option>
          <option value="time">Terbaru</option>
        </select>
      </label>
      <label>
        Per halaman
        <select bind:value={maxResults} disabled={loading}>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>
    </div>
  </form>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if result}
    <div class="result">
      {#if result.videoTitle}
        <h2 class="video-title">"{result.videoTitle}"</h2>
      {/if}

      <div class="result-header">
        <span>
          Menampilkan <strong>{allComments.length.toLocaleString()}</strong>
          dari <strong>{result.totalComments.toLocaleString()}</strong> komentar
        </span>
        <div class="actions">
          <button onclick={downloadCsv}>Unduh CSV</button>
          <button onclick={downloadJson}>Unduh JSON</button>
        </div>
      </div>

      <ul class="comments">
        {#each allComments as comment (comment.id)}
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

      {#if nextPageToken}
        <button class="load-more" onclick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Memuat...' : 'Muat lebih banyak'}
        </button>
      {/if}
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

  h1 {
    margin-bottom: 0.25rem;
  }
  .subtitle {
    color: #666;
    margin-bottom: 2rem;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .filter-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #555;
  }

  .filter-row label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  select {
    padding: 0.3rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.875rem;
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

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #c00;
  }

  .video-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .actions button {
    background: #333;
    font-size: 0.875rem;
  }

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

  .comment-meta strong {
    color: #111;
  }
  .comments p {
    margin: 0;
    line-height: 1.5;
  }

  .load-more {
    display: block;
    width: 100%;
    margin-top: 1.5rem;
    background: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
    padding: 0.75rem;
    font-size: 0.95rem;
  }

  .load-more:hover:not(:disabled) {
    background: #eee;
  }
</style>
