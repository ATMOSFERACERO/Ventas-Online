import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Genera dist/index.html autocontenido: funciona abriéndolo con doble clic (file://)
export default defineConfig({ base: './', plugins: [react(), viteSingleFile()] })
