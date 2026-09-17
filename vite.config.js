import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Explicit vendor split: without this, the bundler's automatic
        // chunking draws chunk boundaries wherever a module happens to be
        // first imported from, which drifts unpredictably as route-level
        // code splitting (React.lazy in App.jsx) changes which page imports
        // what first -- this keeps the split stable across builds.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor';
          }
        },
      },
    },
  },
})
