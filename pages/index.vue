<template>
  <div class="container">
    <main>
      <ReversiBoard />
    </main>
  </div>
</template>

<script setup lang="ts">
// ReversiBoard コンポーネントは自動的にインポートされます
</script>

<style scoped>
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

main {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
