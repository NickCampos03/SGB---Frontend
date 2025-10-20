import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do proxy
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/genero': 'http://localhost:8080',
      '/emprestimos': 'http://localhost:8080',
      '/usuarios': 'http://localhost:8080',
      '/livros': 'http://localhost:8080',
      '/login': 'http://localhost:8080', 
    },
  },
})
