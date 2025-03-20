<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <button v-if="showCloseButton" class="close-button" @click="closeModal">&times;</button>
      <h2 class="settings-title">ゲーム設定</h2>
      <div class="settings-section">
        <div class="setting-group">
          <label class="setting-label">対戦モード</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                v-model="isCPUOpponent"
                type="radio"
                name="gameMode"
                :value="false"
                @change="updateSettings"
              >
              <span>2人プレイ</span>
            </label>
            <label class="radio-label">
              <input
                v-model="isCPUOpponent"
                type="radio"
                name="gameMode"
                :value="true"
                @change="updateSettings"
              >
              <span>CPU対戦</span>
            </label>
          </div>
        </div>

        <div v-if="isCPUOpponent" class="setting-group">
          <label class="setting-label">CPU難易度</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                v-model="cpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.EASY"
                @change="updateSettings"
              >
              <span>初級</span>
            </label>
            <label class="radio-label">
              <input
                v-model="cpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.MEDIUM"
                @change="updateSettings"
              >
              <span>中級</span>
            </label>
            <label class="radio-label">
              <input
                v-model="cpuLevel"
                type="radio"
                name="cpuLevel"
                :value="CPULevel.HARD"
                @change="updateSettings"
              >
              <span>上級</span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-buttons">
        <button class="settings-button" @click="startNewGame">ゲームを開始</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';
import { CPULevel } from '~/utils/CPUPlayer';

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
  isCPUOpponent: boolean;
  cpuLevel: CPULevel;
}

/**
 * CPUと対戦するかどうかのフラグ
 */
const isCPUOpponent = ref<boolean>(false);

/**
 * CPUの難易度
 */
const cpuLevel = ref<CPULevel>(CPULevel.MEDIUM);

/**
 * 設定を更新して親コンポーネントに通知する
 */
const updateSettings = (): void => {
  emit('update:settings', {
    isCPUOpponent: isCPUOpponent.value,
    cpuLevel: cpuLevel.value,
  });
};

/**
 * 新しいゲームを開始する
 * 設定を更新し、ゲーム開始イベントを発行してモーダルを閉じる
 */
const startNewGame = (): void => {
  updateSettings();
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: fade-in 0.3s ease;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 80%;
  max-width: 400px;
  animation: scale-in 0.3s ease;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  font-weight: bold;
  color: #555;
  cursor: pointer;
  padding: 5px 10px;
  line-height: 1;
}

.close-button:hover {
  color: #000;
}

.settings-title {
  font-size: 1.6rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.settings-section {
  margin-bottom: 20px;
}

.setting-group {
  margin-bottom: 15px;
}

.setting-label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #555;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.radio-label input {
  margin-right: 6px;
}

.settings-buttons {
  display: flex;
  justify-content: center;
  margin-top: 25px;
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

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
