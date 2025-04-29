// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-03-07',
  devtools: { enabled: true },

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        target: 'es2023',
        baseUrl: '.',
        paths: {
          '@/*': ['./*'],
          '~/*': ['./*'],
        },
      },
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'リバーシゲーム',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
    },
    // GitHub Pages用のbaseURLを設定
    baseURL: process.env.NODE_ENV === 'production' ? '/reversi/' : '/',
    buildAssetsDir: 'assets',
  },

  // GitHub Pages（静的ホスティング）用にSSRを無効化
  ssr: false,
});
