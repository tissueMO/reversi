<template>
  <div class="container">
    <main>
      <GameSettings
        :is-open="isSettingsOpen"
        :show-close-button="isGameStarted"
        :is-reset-mode="isResetMode"
        @update:settings="updateSettings"
        @new-game="startNewGame"
        @close="closeSettings"
      />
      <ReversiBoard
        v-if="isGameStarted"
        ref="reversiBoard"
        @reset-request="openSettingsFromGame"
        @next-game-request="openSettingsForNextGame"
      />

      <!-- ゲームが開始されていない場合のスタート画面 -->
      <div v-if="!isGameStarted && !isSettingsOpen" class="start-screen">
        <h1 class="game-title">リバーシゲーム</h1>
        <button class="start-button" @click="openSettings">
          ゲーム設定
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GameSettings from '~/components/GameSettings.vue';
import ReversiBoard from '~/components/ReversiBoard.vue';

/**
 * 設定画面の表示状態
 */
const isSettingsOpen = ref<boolean>(true);

/**
 * ゲームが開始されたかどうか
 */
const isGameStarted = ref<boolean>(false);

/**
 * 設定モーダルがリセットモードかどうか
 * ゲーム途中のリセットボタンからモーダルを開いた場合はtrue
 */
const isResetMode = ref<boolean>(false);

/**
 * ReversiBoardコンポーネントへの参照
 */
const reversiBoard = ref<InstanceType<typeof ReversiBoard> | null>(null);

/**
 * 設定画面を開く（ゲーム未開始時）
 */
const openSettings = (): void => {
  isResetMode.value = false;
  isSettingsOpen.value = true;
};

/**
 * ゲーム中にリセットボタンから設定画面を開く
 * 盤面を維持したままモーダルを表示
 */
const openSettingsFromGame = (): void => {
  isResetMode.value = true;
  isSettingsOpen.value = true;
};

/**
 * ゲームクリア後に「次のゲームへ」ボタンから設定画面を開く
 * ゲーム初期開始時と同様に盤面を非表示にする
 */
const openSettingsForNextGame = (): void => {
  isResetMode.value = false;
  isGameStarted.value = false;
  isSettingsOpen.value = true;
};

/**
 * 設定画面を閉じる
 */
const closeSettings = (): void => {
  isSettingsOpen.value = false;
};

/**
 * 設定が更新されたときの処理
 */
const updateSettings = (settings: { isCPUOpponent: boolean; cpuLevel: string }) => {
  if (reversiBoard.value) {
    const event = new CustomEvent('update:settings', { detail: settings });
    window.dispatchEvent(event);
  }
};

/**
 * 新しいゲームを開始する処理
 */
const startNewGame = () => {
  // ゲームがまだ開始されていなければ開始状態にする
  if (!isGameStarted.value) {
    isGameStarted.value = true;
  }

  // コンポーネントのマウント後にresetGameを呼び出すため、nextTickで遅延実行
  setTimeout(() => {
    if (reversiBoard.value) {
      reversiBoard.value.resetGame();
    }
  }, 0);
};
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/**
 * スタート画面のスタイル
 */
.start-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.game-title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
}

.start-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 200px;
}

.start-button:hover {
  background-color: #388E3C;
}
</style>
