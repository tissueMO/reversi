<template>
  <BaseModal :is-open="isOpen" @close="handleNextGame">
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
  </BaseModal>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import BaseModal from '~/components/BaseModal.vue';

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
 * モーダルを閉じるイベント、ゲームリセットイベント、次のゲームへ進むイベントを発行
 */
const emit = defineEmits<{
  (e: 'close' | 'reset-game' | 'next-game'): void;
}>();

/**
 * 「次のゲームへ」ボタンを押したときの処理
 * 次のゲーム設定画面を表示するためのイベントを発行
 */
const handleNextGame = (): void => {
  emit('next-game'); // 次のゲーム設定画面表示イベントを発行
  emit('close'); // モーダルを閉じる
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
