<template>
  <div class="container">
    <main>
      <ReversiBoard />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * リバーシゲームのメインページ
 * ゲームボードコンポーネントを中央に配置する
 */
// ReversiBoard コンポーネントは自動的にインポートされます
</script>

<style scoped>
/**
 * ゲームのコンテナスタイル
 * 画面全体にゲームを表示し、中央配置する
 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

/**
 * メインコンテンツ領域
 * ゲームボードを中央に配置するための領域
 */
main {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
