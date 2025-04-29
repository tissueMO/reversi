<template>
  <BaseModal :is-open="isOpen" @close="handleNextGame">
    <div class="result-text">
      {{ resultText }}
    </div>
    <div class="score-container">
      <div class="score-item">
        <div class="color-icon" :class="player1ColorClass" />
        <div class="score-label">{{ player1DisplayName }}: {{ player1Count }}</div>
      </div>
      <div class="score-item">
        <div class="color-icon" :class="player2ColorClass" />
        <div class="score-label">{{ player2DisplayName }}: {{ player2Count }}</div>
      </div>
    </div>
    <button class="ok-button" @click="handleNextGame">次のゲームへ</button>
  </BaseModal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import BaseModal from './BaseModal.vue';
import type { GameMode } from '../utils/GameLogic/constants';
import { BLACK } from '../utils/GameLogic/constants';

const props = defineProps<{
  isOpen: boolean;
  player1Count: number;
  player2Count: number;
  player1Color: number;
  player2Color: number;
  gameMode?: GameMode;
}>();

const emit = defineEmits<{
  (e: 'close' | 'next-game'): void;
}>();

const player1ColorClass = computed((): string => {
  return props.player1Color === BLACK ? 'black-icon' : 'white-icon';
});
const player2ColorClass = computed((): string => {
  return props.player2Color === BLACK ? 'black-icon' : 'white-icon';
});

const player1DisplayName = computed((): string => {
  switch (props.gameMode) {
    case 'playerVsCPU':
      return 'あなた';
    case 'cpuVsCpu':
      return 'CPU.1';
    default:
      return 'プレイヤー1';
  }
});
const player2DisplayName = computed((): string => {
  switch (props.gameMode) {
    case 'playerVsCPU':
      return 'CPU';
    case 'cpuVsCpu':
      return 'CPU.2';
    default:
      return 'プレイヤー2';
  }
});

const resultText = computed((): string => {
  if (props.player1Count > props.player2Count) {
    return `${player1DisplayName.value}の勝ち`;
  } else if (props.player1Count < props.player2Count) {
    return `${player2DisplayName.value}の勝ち`;
  } else {
    return '引き分け';
  }
});

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
