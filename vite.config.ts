import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from "path"
import tailwindcss from "@tailwindcss/vite"


// https://vitejs.dev/config/
export default defineConfig({

  plugins: [react(), tailwindcss()],

  build: {
    outDir: 'docs',
  },

  base: '', // Use relative paths, so the app works when the root is not the / but a subfolder like in iOS or GitHub Pages

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

})
