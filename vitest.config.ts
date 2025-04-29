/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import Vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts'],
    deps: {
      inline: ['@nuxt/test-utils'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
    },
  },
});
