<template>
  <BaseModal :is-open="isOpen" :show-close-button="showCloseButton" @close="closeModal">
    <h2 class="settings-title">ゲーム設定</h2>
    <div class="settings-container">
      <div class="settings-section">
        <div class="setting-group">
          <label class="setting-label">対戦モード</label>
          <div class="radio-container">
            <label class="radio-label">
              <input
                v-model="tempGameMode"
                type="radio"
                name="gameMode"
                value="twoPlayers"
              >
              プレイヤー対プレイヤー
            </label>
            <label class="radio-label">
              <input
                v-model="tempGameMode"
                type="radio"
                name="gameMode"
                value="playerVsCPU"
              >
              プレイヤー対CPU
            </label>
            <label class="radio-label">
              <input
                v-model="tempGameMode"
                type="radio"
                name="gameMode"
                value="cpuVsCpu"
              >
              CPU対CPU
            </label>
          </div>
        </div>
        <div v-if="tempGameMode !== 'twoPlayers'" class="setting-group">
          <label class="setting-label">{{ tempGameMode === 'playerVsCPU' ? 'CPU 強さ' : 'CPU.1 強さ' }}</label>
          <div class="radio-container radio-row">
            <label class="radio-label">
              <input
                v-model="tempCpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.EASY"
              >
              初級
            </label>
            <label class="radio-label">
              <input
                v-model="tempCpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.MEDIUM"
              >
              中級
            </label>
            <label class="radio-label">
              <input
                v-model="tempCpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.HARD"
              >
              上級
            </label>
            <label class="radio-label">
              <input
                v-model="tempCpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.ULTIMATE"
              >
              最強
            </label>
          </div>
        </div>
        <div v-if="tempGameMode === 'cpuVsCpu'" class="setting-group">
          <label class="setting-label">CPU.2 強さ</label>
          <div class="radio-container radio-row">
            <label class="radio-label">
              <input
                v-model="tempCpu2Level"
                type="radio"
                name="cpu2Level"
                :value="CPULevel.EASY"
              >
              初級
            </label>
            <label class="radio-label">
              <input
                v-model="tempCpu2Level"
                type="radio"
                name="cpu2Level"
                :value="CPULevel.MEDIUM"
              >
              中級
            </label>
            <label class="radio-label">
              <input
                v-model="tempCpu2Level"
                type="radio"
                name="cpu2Level"
                :value="CPULevel.HARD"
              >
              上級
            </label>
            <label class="radio-label">
              <input
                v-model="tempCpu2Level"
                type="radio"
                name="cpu2Level"
                :value="CPULevel.ULTIMATE"
              >
              最強
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="settings-buttons">
      <button class="settings-button" @click="startNewGame">
        {{ isResetMode ? 'ゲームをリセット' : 'ゲームを開始' }}
      </button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps, watch, onMounted } from 'vue';
import { CPULevel } from '~/utils/CPUPlayer';
import BaseModal from '~/components/BaseModal.vue';

/**
 * ゲーム設定モーダルクラス
 * 対戦モード・CPU強さ・リセット制御を担う
 */
const props = defineProps<{
  isOpen: boolean;
  showCloseButton?: boolean;
  isResetMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:settings', settings: GameSettings): void,
  (e: 'new-game' | 'close'): void
}>();

/**
 * ゲーム設定型
 */
interface GameSettings {
  gameMode: GameMode;
  cpuLevel: CPULevel;
  cpu2Level: CPULevel;
}

const gameMode = ref<GameMode>('twoPlayers');
const cpuLevel = ref<CPULevel>(CPULevel.MEDIUM);
const cpu2Level = ref<CPULevel>(CPULevel.MEDIUM);
const tempGameMode = ref<GameMode>('twoPlayers');
const tempCpuLevel = ref<CPULevel>(CPULevel.MEDIUM);
const tempCpu2Level = ref<CPULevel>(CPULevel.MEDIUM);

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    tempGameMode.value = gameMode.value;
    tempCpuLevel.value = cpuLevel.value;
    tempCpu2Level.value = cpu2Level.value;
  }
});

onMounted(() => {
  tempGameMode.value = gameMode.value;
  tempCpuLevel.value = cpuLevel.value;
  tempCpu2Level.value = cpu2Level.value;
});

/**
 * 新しいゲームを開始します。
 */
const startNewGame = (): void => {
  gameMode.value = tempGameMode.value;
  cpuLevel.value = tempCpuLevel.value;
  cpu2Level.value = tempCpu2Level.value;
  const settings: GameSettings = {
    gameMode: gameMode.value,
    cpuLevel: cpuLevel.value,
    cpu2Level: cpu2Level.value,
  };
  emit('update:settings', settings);
  emit('new-game');
  emit('close');
};

/**
 * モーダルを閉じます。
 */
const closeModal = (): void => {
  emit('close');
};
</script>

<style scoped>
.settings-title {
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.settings-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.settings-section {
  width: 100%;
  max-width: 350px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
  color: #555;
  text-align: left;
}

/* 完全に新しいラジオボタンのレイアウト */
.radio-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 20px;
  align-items: flex-start;
}

.radio-container.radio-row {
  flex-direction: row;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-left: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.radio-label input {
  margin-right: 8px;
}

.settings-buttons {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.settings-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 30px;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 200px;
}

.settings-button:hover {
  background-color: #388E3C;
}
</style>
