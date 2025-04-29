<template>
  <div class="container">
    <main>
      <GameSettings
        :is-open="isSettingsOpen"
        :show-close-button="isGameStarted"
        :is-reset-mode="isResetMode"
        @update:settings="updateGameSettings"
        @new-game="startNewGame"
        @close="closeSettings"
      />
      <ReversiBoard
        v-if="isGameStarted"
        ref="reversiBoard"
        :game-mode="gameSettings.gameMode"
        :cpu-level="gameSettings.cpuLevel"
        :cpu2-level="gameSettings.cpu2Level"
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
import { CPULevel } from '~/utils/CPUPlayer';

/**
 * ゲーム設定の型定義
 */
interface GameSettings {
  gameMode: GameMode;
  cpuLevel: CPULevel;
  cpu2Level: CPULevel;
}

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
 * ゲーム設定
 */
const gameSettings = ref<GameSettings>({
  gameMode: 'twoPlayers',
  cpuLevel: CPULevel.MEDIUM,
  cpu2Level: CPULevel.MEDIUM,
});

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
const updateGameSettings = (settings: GameSettings): void => {
  console.log('設定を更新します:', settings);

  // 設定を現在の状態に保存
  gameSettings.value = {
    gameMode: settings.gameMode,
    cpuLevel: settings.cpuLevel,
    cpu2Level: settings.cpu2Level,
  };
};

/**
 * 新しいゲームを開始する処理
 */
const startNewGame = () => {
  // ゲームがまだ開始されていなければ開始状態にする
  if (!isGameStarted.value) {
    isGameStarted.value = true;
  }

  // コンポーネントのマウント後にresetGameを呼び出すため、遅延実行
  setTimeout(() => {
    if (reversiBoard.value) {
      reversiBoard.value.resetGame();
    }
  }, 100);
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
