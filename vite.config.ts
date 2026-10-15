import { defineConfig } from 'vite';

// Configuración de Vite para el sudoku.
// Base relativa: la PWA y la TWA funcionan igual en local y en
// https://andreu-marbor.github.io/sudoku/ (subdirectorio de Pages).
export default defineConfig({
  base: './',
  server: {
    host: true, // accesible desde el móvil en la misma red local
    port: 5173,
  },
});
