import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Careva/' : '/',
  build: { outDir: 'dist' }
});
