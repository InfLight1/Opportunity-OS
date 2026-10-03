import path from "path"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side only: no VITE_ prefix, so neither value reaches the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.GEMINI_API_KEY ?? ''
  // Accept 'gemini-x', 'models/gemini-x' or a quoted value.
  const model = (env.GEMINI_MODEL ?? '').trim().replace(/^["']|["']$/g, '').replace(/^models\//, '')
  if (mode === 'development') {
    console.info(`[llm proxy] model=${model || '(missing)'} key=${apiKey ? 'set' : 'missing'}`)
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Browser: POST /api/llm/generate -> Gemini generateContent for GEMINI_MODEL,
        // with the key added here. Dev server only; the built app has no proxy
        // and Ask why falls back to cached answers, then templates.
        '/api/llm': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/llm\/generate$/, `/v1beta/models/${model}:generateContent`),
          headers: { 'x-goog-api-key': apiKey },
        },
      },
    },
  }
})
