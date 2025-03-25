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
 * コンポーネントのプロパティ定義
 */
const props = defineProps<{
  /**
   * モーダルの表示状態
   */
  isOpen: boolean;
  /**
   * 閉じるボタンを表示するかどうか
   * ゲーム開始前は表示せず、ゲーム中のリセット時に表示する
   */
  showCloseButton?: boolean;
  /**
   * リセットモードかどうか
   * ゲーム途中のリセットボタンからモーダルを開いた場合はtrue
   * ゲーム開始前やゲームクリア後のモーダル表示ではfalse
   */
  isResetMode?: boolean;
}>();

/**
 * emitするイベントの定義
 */
const emit = defineEmits<{
  /**
   * 設定が更新されたときに発行されるイベント
   */
  (e: 'update:settings', settings: GameSettings): void,
  /**
   * 新しいゲームが開始されたときに発行されるイベント
   */
  (e: 'new-game'): void,
  /**
   * モーダルを閉じるイベント
   */
  (e: 'close'): void
}>();

/**
 * ゲーム設定の型定義
 */
interface GameSettings {
  gameMode: 'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu';
  cpuLevel: CPULevel;
  cpu2Level: CPULevel;
}

/**
 * 現在の設定値（ゲーム中に実際に使用される値）
 */
const gameMode = ref<'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu'>('twoPlayers');
const cpuLevel = ref<CPULevel>(CPULevel.MEDIUM);
const cpu2Level = ref<CPULevel>(CPULevel.MEDIUM);

/**
 * モーダル内での一時的な設定値（確定前の値）
 */
const tempGameMode = ref<'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu'>('twoPlayers');
const tempCpuLevel = ref<CPULevel>(CPULevel.MEDIUM);
const tempCpu2Level = ref<CPULevel>(CPULevel.MEDIUM);

/**
 * モーダルが開かれたときに現在の設定を一時保存領域にコピー
 */
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    tempGameMode.value = gameMode.value;
    tempCpuLevel.value = cpuLevel.value;
    tempCpu2Level.value = cpu2Level.value;
  }
});

/**
 * 初期化
 */
onMounted(() => {
  tempGameMode.value = gameMode.value;
  tempCpuLevel.value = cpuLevel.value;
  tempCpu2Level.value = cpu2Level.value;
});

/**
 * 設定を更新して親コンポーネントに通知する
 */
const updateSettings = (): void => {
  // 一時設定を実際の設定に反映
  gameMode.value = tempGameMode.value;
  cpuLevel.value = tempCpuLevel.value;
  cpu2Level.value = tempCpu2Level.value;

  const settings: GameSettings = {
    gameMode: gameMode.value,
    cpuLevel: cpuLevel.value,
    cpu2Level: cpu2Level.value,
  };

  // 明示的な型で設定を更新
  emit('update:settings', settings);
};

/**
 * 新しいゲームを開始する
 * 設定を更新し、ゲーム開始イベントを発行してモーダルを閉じる
 */
const startNewGame = (): void => {
  // 一時設定を実際の設定に反映
  gameMode.value = tempGameMode.value;
  cpuLevel.value = tempCpuLevel.value;
  cpu2Level.value = tempCpu2Level.value;

  const settings: GameSettings = {
    gameMode: gameMode.value,
    cpuLevel: cpuLevel.value,
    cpu2Level: cpu2Level.value,
  };

  console.log('GameSettings: 設定を確定してゲームを開始します', settings);

  // 明示的な型で設定を更新
  emit('update:settings', settings);
  emit('new-game');
  emit('close');
};

/**
 * モーダルを閉じる
 * ゲーム中のリセット時にバツボタンで閉じるために使用
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
