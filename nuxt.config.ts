// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'リバーシゲーム',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    },
    // GitHub Pages用のbaseURLを設定
    baseURL: process.env.NODE_ENV === 'production' ? '/reversi/' : '/',
    buildAssetsDir: 'assets'
  },
  // GitHub Pages（静的ホスティング）用にSSRを無効化
  ssr: false
})
