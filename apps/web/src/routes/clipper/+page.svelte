<script lang="ts">
  /**
   * YT Clipper page — /clipper
   *
   * Alur:
   *   1. User input YouTube URL + Gemini API key (BYOK)
   *   2. Frontend → ytmod-api /clipper/analyze → Clipper Engine /analyze
   *   3. Engine analisa video dengan Gemini AI, return suggested clips
   *   4. User pilih clips yang diinginkan
   *   5. Frontend → ytmod-api /clipper/clip → Clipper Engine /clip
   *   6. Engine jalankan ffmpeg, return hasil per clip
   *
   * Engine URL bisa dikonfigurasi user dan disimpan di localStorage.
   * Set VITE_API_URL di .env untuk mengarahkan ke instance ytmod-api yang sesuai.
   */

  import type { ClipConfig, ClipperAnalyzeResponse, ClipperClipResponse, Clip } from '@ytmod/shared'

  const API_BASE = import.meta.env.VITE_API_URL
  if (!API_BASE) throw new Error('VITE_API_URL is not set')

  // Default engine URL — override via UI input atau env var VITE_CLIPPER_ENGINE_URL
  const DEFAULT_ENGINE_URL = 'http://localhost:8080'

  // State: form inputs
  let videoInput = $state('')
  let geminiKey = $state('')
  let engineUrl = $state(
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem('clipper_engine_url') ?? DEFAULT_ENGINE_URL)
      : DEFAULT_ENGINE_URL
  )

  // State: analysis result
  let analyzing = $state(false)
  let analyzeError = $state('')
  let config = $state<ClipConfig | null>(null)

  // State: clip selection (index → selected)
  let selected = $state<Set<number>>(new Set())

  // State: clipping result
  let clipping = $state(false)
  let clipError = $state('')
  let clipResults = $state<ClipperClipResponse['results'] | null>(null)

  /** Persist engine URL to localStorage whenever it changes */
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('clipper_engine_url', engineUrl)
    }
  })

  function extractVideoId(input: string): string {
    try {
      const url = new URL(input)
      return url.searchParams.get('v') ?? url.pathname.split('/').pop() ?? input
    } catch {
      return input.trim()
    }
  }

  /** Step 1: Analyze video with Gemini AI via ytmod-api proxy */
  async function analyze() {
    if (!videoInput.trim() || !geminiKey.trim()) return
    analyzing = true
    analyzeError = ''
    config = null
    selected = new Set()
    clipResults = null

    // Build full YouTube URL from video ID if needed
    const videoId = extractVideoId(videoInput)
    const url = videoInput.startsWith('http')
      ? videoInput
      : `https://www.youtube.com/watch?v=${videoId}`

    try {
      const res = await fetch(`${API_BASE}/clipper/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, gemini_api_key: geminiKey }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as ClipperAnalyzeResponse
      config = data.config
      // Pre-select all clips by default
      selected = new Set(data.config.clips.map((_, i) => i))
    } catch (e) {
      analyzeError = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      analyzing = false
    }
  }

  /** Step 2: Process selected clips via ytmod-api proxy */
  async function processClips() {
    if (!config || selected.size === 0) return
    clipping = true
    clipError = ''
    clipResults = null

    // Only send clips that user selected
    const selectedClips: Clip[] = config.clips.filter((_, i) => selected.has(i))
    const clipConfig: ClipConfig = { ...config, clips: selectedClips }

    try {
      const res = await fetch(`${API_BASE}/clipper/clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: clipConfig }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as ClipperClipResponse
      clipResults = data.results
    } catch (e) {
      clipError = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      clipping = false
    }
  }

  function toggleClip(i: number) {
    const next = new Set(selected)
    next.has(i) ? next.delete(i) : next.add(i)
    selected = next
  }
</script>

<svelte:head>
  <title>YTMod — YT Clipper</title>
</svelte:head>

<main>
  <h1>YT Clipper</h1>
  <p class="subtitle">Analisa video YouTube dengan AI dan buat clips viral otomatis</p>

  <!-- Engine URL config — persisted to localStorage -->
  <details class="engine-config">
    <summary>⚙️ Konfigurasi Engine</summary>
    <div class="engine-row">
      <label for="engine-url">Clipper Engine URL</label>
      <input id="engine-url" type="url" bind:value={engineUrl} placeholder={DEFAULT_ENGINE_URL} />
      <small>
        Contoh: <code>http://localhost:8080</code> (lokal) ·
        <code>https://abc123.ngrok-free.app</code> (ngrok) ·
        <code>https://clipper-api.yourdomain.com</code> (production)
      </small>
    </div>
  </details>

  <!-- Step 1: Analyze form -->
  <form
    onsubmit={(e) => {
      e.preventDefault()
      analyze()
    }}
  >
    <div class="input-row">
      <input
        type="text"
        bind:value={videoInput}
        placeholder="URL atau Video ID YouTube"
        aria-label="URL atau Video ID YouTube"
        disabled={analyzing}
      />
    </div>
    <div class="input-row">
      <input
        type="password"
        bind:value={geminiKey}
        placeholder="Gemini API Key (BYOK — tidak disimpan di server)"
        aria-label="Gemini API Key"
        disabled={analyzing}
      />
    </div>
    <button type="submit" disabled={analyzing || !videoInput.trim() || !geminiKey.trim()}>
      {analyzing ? '🤖 Menganalisa...' : '🔍 Analisa Video'}
    </button>
  </form>

  {#if analyzeError}
    <p class="error" role="alert">{analyzeError}</p>
  {/if}

  <!-- Step 2: Clip selection -->
  {#if config}
    <div class="clips-section">
      <h2>Suggested Clips</h2>
      <p class="hint">Pilih clips yang ingin diproses:</p>

      <ul class="clips">
        {#each config.clips as clip, i (i)}
          <li class:selected={selected.has(i)}>
            <label>
              <input type="checkbox" checked={selected.has(i)} onchange={() => toggleClip(i)} />
              <span class="clip-info">
                <strong>{clip.output}</strong>
                <span class="timestamps">{clip.start} → {clip.end}</span>
              </span>
            </label>
          </li>
        {/each}
      </ul>

      <button class="clip-btn" onclick={processClips} disabled={clipping || selected.size === 0}>
        {clipping ? '✂️ Memproses...' : `✂️ Clip ${selected.size} video`}
      </button>
    </div>
  {/if}

  {#if clipError}
    <p class="error" role="alert">{clipError}</p>
  {/if}

  <!-- Step 3: Results -->
  {#if clipResults}
    <div class="results-section">
      <h2>Hasil Clipping</h2>
      <ul class="results">
        {#each clipResults as result (result.output)}
          <li class:success={result.success} class:fail={!result.success}>
            {result.success ? '✅' : '❌'}
            {result.output}
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

  h1 {
    margin-bottom: 0.25rem;
  }
  .subtitle {
    color: #666;
    margin-bottom: 1.5rem;
  }

  /* Engine config collapsible */
  .engine-config {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .engine-config summary {
    cursor: pointer;
    color: #555;
  }

  .engine-row {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }

  .engine-row label {
    font-weight: 500;
  }
  .engine-row small {
    color: #888;
  }
  .engine-row code {
    font-size: 0.8rem;
    background: #f5f5f5;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  input[type='text'],
  input[type='password'],
  input[type='url'] {
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

  /* Clip selection list */
  .clips-section {
    margin-top: 2rem;
  }
  .hint {
    color: #666;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .clips {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .clips li {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.6rem 0.8rem;
    transition: border-color 0.15s;
  }

  .clips li.selected {
    border-color: #e00;
    background: #fff5f5;
  }

  .clips label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .clip-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .timestamps {
    font-size: 0.8rem;
    color: #888;
    font-family: monospace;
  }

  .clip-btn {
    background: #333;
    margin-top: 0.5rem;
  }

  /* Results */
  .results-section {
    margin-top: 2rem;
  }

  .results {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .results li {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  .results li.success {
    background: #f0fff4;
    border: 1px solid #b2f5c8;
  }
  .results li.fail {
    background: #fff5f5;
    border: 1px solid #ffc5c5;
  }
</style>
