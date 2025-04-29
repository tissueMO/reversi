<template>
  <BaseModal :is-open="isOpen" @close="handleNextGame">
    <div class="result-text" :class="{ 'player-win': isPlayerWin }">
      {{ resultText }}
    </div>
    <div class="score-container">
      <div class="score-item">
        <div class="color-icon" :class="playerColorClass" />
        <div class="score-label">{{ playerDisplayName }}: {{ playerCount }}</div>
      </div>
      <div class="score-item">
        <div class="color-icon" :class="opponentColorClass" />
        <div class="score-label">{{ opponentDisplayName }}: {{ opponentCount }}</div>
      </div>
    </div>
    <button class="ok-button" @click="handleNextGame">次のゲームへ</button>
  </BaseModal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import BaseModal from './BaseModal.vue';

/**
 * ゲーム結果モーダルクラス
 * 勝敗・スコア・UI制御を担う
 */
const props = defineProps<{
  isOpen: boolean;
  isPlayerWin: boolean;
  playerCount: number;
  opponentCount: number;
  playerColor: number;
  gameMode?: 'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu';
}>();

/**
 * プレイヤー色クラスを返します。
 */
const playerColorClass = computed((): string => {
  return props.playerColor === 1 ? 'black-icon' : 'white-icon';
});

/**
 * 相手色クラスを返します。
 */
const opponentColorClass = computed((): string => {
  return props.playerColor === 1 ? 'white-icon' : 'black-icon';
});

/**
 * プレイヤー表示名を返します。
 */
const playerDisplayName = computed((): string => {
  switch (props.gameMode) {
    case 'twoPlayers':
      return 'プレイヤー1';
    case 'playerVsCPU':
      return 'あなた';
    case 'cpuVsCpu':
      return 'CPU.1';
    default:
      return 'プレイヤー1';
  }
});

/**
 * 相手表示名を返します。
 */
const opponentDisplayName = computed((): string => {
  switch (props.gameMode) {
    case 'twoPlayers':
      return 'プレイヤー2';
    case 'playerVsCPU':
      return 'CPU';
    case 'cpuVsCpu':
      return 'CPU.2';
    default:
      return 'プレイヤー2';
  }
});

/**
 * 勝敗テキストを返します。
 */
const resultText = computed((): string => {
  switch (props.gameMode) {
    case 'twoPlayers':
      return props.isPlayerWin ? 'プレイヤー1の勝ち' : 'プレイヤー2の勝ち';
    case 'playerVsCPU':
      return props.isPlayerWin ? 'あなたの勝ち' : 'あなたの負け';
    case 'cpuVsCpu':
      return props.isPlayerWin ? 'CPU.1の勝ち' : 'CPU.2の勝ち';
    default:
      return props.isPlayerWin ? 'プレイヤー1の勝ち' : 'プレイヤー2の勝ち';
  }
});

const emit = defineEmits<{
  (e: 'close' | 'reset-game' | 'next-game'): void;
}>();

/**
 * 「次のゲームへ」ボタン押下時の処理を行います。
 */
const handleNextGame = (): void => {
  emit('next-game');
  emit('close');
};
</script>

<style scoped>
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
</style>
