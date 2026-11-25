/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => ({
  base: './',
  plugins: command === 'build' ? [react(), viteSingleFile()] : [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
