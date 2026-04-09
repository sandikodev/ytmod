<script lang="ts">
  import favicon from '$lib/assets/favicon.svg'
  import { base } from '$app/paths'
  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<nav>
  <a href="{base}/">💬 Komentar</a>
  <a href="{base}/transcript">📝 Transcript</a>
  <a href="{base}/clipper">✂️ Clipper</a>
</nav>

{@render children()}

<style>
  nav {
    max-width: 720px;
    margin: 1rem auto 0;
    padding: 0 1rem;
    display: flex;
    gap: 1.5rem;
    font-family: system-ui, sans-serif;
    font-size: 0.9rem;
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
</style>
