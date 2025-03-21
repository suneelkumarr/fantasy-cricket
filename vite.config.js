import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    allowedHosts: [
      '926c-2409-40d4-152-8b7a-207e-522d-d045-482d.ngrok-free.app',
      '36d9-223-229-215-174.ngrok-free.app',
      'https://85d7-223-226-127-135.ngrok-free.app',
      '85d7-223-226-127-135.ngrok-free.app'
    ],
proxy: {
      // Proxy for Score Predictor
      '/pl-labs-mobile/score-predictor': {
        target: 'https://www.perfectlineup.in',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/pl-labs-mobile\/score-predictor\/NZ_vs_PAK/,
            '/pl-labs-mobile/score-predictor/NZ-VS-PAK'
          ),
      },
      // Proxy for Coverage Index
      '/pl-labs-mobile/coverage-index': {
        target: 'https://www.perfectlineup.in',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/pl-labs-mobile\/coverage-index\/NZ_vs_PAK/,
            '/pl-labs-mobile/coverage-index/NZ-VS-PAK'
          ),
      },
      // Proxy for Player Combination
      '/pl-labs-mobile/player-combination': {
        target: 'https://www.perfectlineup.in',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/pl-labs-mobile\/player-combination\/NZ_vs_PAK/,
            '/pl-labs-mobile/player-combination/NZ-VS-PAK'
          ),
      },
      // Proxy for Captain Suggestion
      '/pl-labs-mobile/captain-suggestion': {
        target: 'https://www.perfectlineup.in',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/pl-labs-mobile\/captain-suggestion\/NZ_vs_PAK/,
            '/pl-labs-mobile/captain-suggestion/NZ-VS-PAK'
          ),
      },
    }
  }
})
