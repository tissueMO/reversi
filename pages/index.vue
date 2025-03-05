<template>
  <div class="container">
    <header>
      <h1>オセロゲーム</h1>
    </header>
    <main>
      <ReversiBoard />
    </main>
    <footer>
      <p>&copy; 2023 リバーシゲーム</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// ReversiBoard コンポーネントは自動的にインポートされます
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

h1 {
  color: var(--primary-color);
}

main {
  flex: 1;
  display: flex;
  justify-content: center;
}

footer {
  text-align: center;
  margin-top: 30px;
  padding: 10px 0;
  color: #666;
}
</style>
