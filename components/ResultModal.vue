<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="result-text" :class="{ 'player-win': isPlayerWin }">
        {{ resultText }}
      </div>

      <div class="score-container">
        <div class="score-item">
          <div class="color-icon" :class="playerColorClass"/>
          <div class="score-label">自分: {{ playerCount }}</div>
        </div>
        <div class="score-item">
          <div class="color-icon" :class="opponentColorClass"/>
          <div class="score-label">相手: {{ opponentCount }}</div>
        </div>
      </div>

      <button class="ok-button" @click="handleNextGame">次のゲームへ</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';

/**
 * モーダルの表示状態、結果テキスト、プレイヤー勝利フラグ、スコア情報を受け取る
 */
const props = defineProps<{
  isOpen: boolean;
  resultText: string;
  isPlayerWin: boolean;
  playerCount: number;
  opponentCount: number;
  playerColor: number;
}>();

/**
 * プレイヤー色に対応するCSSクラス
 */
const playerColorClass = computed((): string => {
  return props.playerColor === 1 ? 'black-icon' : 'white-icon';
});

/**
 * 相手色に対応するCSSクラス
 */
const opponentColorClass = computed((): string => {
  return props.playerColor === 1 ? 'white-icon' : 'black-icon';
});

/**
 * モーダルを閉じるイベントとゲームリセットイベントを発行
 */
const emit = defineEmits<{
  (e: 'close' | 'reset-game'): void;
}>();

/**
 * 「次のゲームへ」ボタンを押したときの処理
 * モーダルを閉じてゲームをリセットする
 */
const handleNextGame = (): void => {
  emit('reset-game'); // 先にゲームリセットイベントを発行
  emit('close'); // その後モーダルを閉じる
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
}

.result-text {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.player-win {
  color: #2e7d32;
}

.score-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 25px;
}

.score-item {
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.color-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 10px;
}

.black-icon {
  background-color: #000;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.white-icon {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid #ccc;
}

.score-label {
  white-space: nowrap;
}

.ok-button {
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

.ok-button:hover {
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
