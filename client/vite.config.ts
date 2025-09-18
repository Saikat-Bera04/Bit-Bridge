import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true,
    strictPort: false,
    hmr: {
      overlay: false,
      port: 3001
    },
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@perawallet') || id.includes('algosdk')) {
              return 'crypto';
            }
            if (id.includes('@radix-ui') || id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    sourcemap: false
  },
  // Add this for Vercel deployment
  publicDir: 'public',
  base: '/',
  // This helps Vercel detect the framework
  // @ts-ignore
  vercel: {
    framework: 'vite',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    devCommand: 'vite --port $PORT',
    installCommand: 'npm install'
  },
  esbuild: {
    target: 'es2022'
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'framer-motion',
      '@perawallet/connect',
      'algosdk',
      'axios',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      'lucide-react',
      'sonner',
      'buffer'
    ],
    exclude: ['@vite/client', '@vite/env'],
    force: true
  },
  preview: {
    port: 3000,
    host: '::',
    strictPort: false
  }
})
