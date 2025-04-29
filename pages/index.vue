<template>
  <div class="container">
    <main>
      <ReversiBoard
        v-if="isGameStarted"
        ref="reversiBoard"
        :game-mode="gameSettings.gameMode"
        :cpu1-level="gameSettings.cpu1Level"
        :cpu2-level="gameSettings.cpu2Level"
        @reset-request="openSettingsFromGame"
        @next-game-request="openSettingsForNextGame"
      />
      <GameSettings
        :is-open="isSettingsOpen"
        :show-close-button="isGameStarted"
        :is-reset-mode="isResetMode"
        @update:settings="updateSettings"
        @new-game="startNewGame"
        @close="closeSettings"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GameSettings from '~/components/GameSettings.vue';
import ReversiBoard from '~/components/ReversiBoard.vue';
import { CPULevel } from '~/utils/CPUPlayer';

interface GameSettings {
  gameMode: GameMode;
  cpu1Level: CPULevel;
  cpu2Level: CPULevel;
}

const isSettingsOpen = ref<boolean>(true);
const isGameStarted = ref<boolean>(false);
const isResetMode = ref<boolean>(false);
const reversiBoard = ref<InstanceType<typeof ReversiBoard> | null>(null);
const gameSettings = ref<GameSettings>({
  gameMode: 'twoPlayers',
  cpu1Level: CPULevel.MEDIUM,
  cpu2Level: CPULevel.MEDIUM,
});

const openSettingsFromGame = (): void => {
  isResetMode.value = true;
  isSettingsOpen.value = true;
};
const openSettingsForNextGame = (): void => {
  isResetMode.value = false;
  isSettingsOpen.value = true;
  isGameStarted.value = false;
};

const closeSettings = (): void => {
  isSettingsOpen.value = false;
};

const updateSettings = (settings: GameSettings): void => {
  gameSettings.value = {
    gameMode: settings.gameMode,
    cpu1Level: settings.cpu1Level,
    cpu2Level: settings.cpu2Level,
  };
};

const startNewGame = () => {
  if (!isGameStarted.value) {
    isGameStarted.value = true;
  }

  // コンポーネントのマウント後に呼び出すため、遅延実行させる
  setTimeout(() => {
    if (reversiBoard.value) {
      reversiBoard.value.resetGame();
    }
  }, 100);
};
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

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
