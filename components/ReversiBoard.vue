<template>
  <div ref="boardRef" class="reversi-board fade-in">
    <div class="game-info top-info">
      <div class="score opponent-score" :class="{ 'current-turn': gameLogic.getCurrentPlayer() !== playerColor }">
        <div class="score-content">
          <div class="score-icon-and-count" :class="{ 'rotated': isMobileDevice }">
            <div class="color-icon" :class="opponentColorClass" />
            <div class="score-text">
              {{ opponentDisplayName }}: <span class="count-display">{{ opponentCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="board-container">
      <div
        v-for="(row, rowIndex) in board"
        :key="`row-${rowIndex}`"
        class="board-row"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="`cell-${rowIndex}-${colIndex}`"
          class="board-cell"
          :class="{ 'valid-move': isValidMove(rowIndex, colIndex) && !animationManager.isAnimating.value }"
          @click="makeMove(rowIndex, colIndex)"
        >
          <div
            v-if="cell !== 0"
            class="piece"
            :class="{
              'piece-black': cell === 1,
              'piece-white': cell === 2,
              'flipping': animationManager.isFlipping(rowIndex, colIndex)
            }"
          />
          <div v-else-if="isValidMove(rowIndex, colIndex) && !animationManager.isAnimating.value" class="valid-move-indicator" />
        </div>
      </div>
    </div>
    <div class="game-info bottom-info">
      <div class="score player-score" :class="{ 'current-turn': gameLogic.getCurrentPlayer() === playerColor }">
        <div class="score-content">
          <div class="score-icon-and-count">
            <div class="color-icon" :class="playerColorClass" />
            <div class="score-text">
              {{ playerDisplayName }}: <span class="count-display">{{ playerCount }}</span>
            </div>
          </div>
        </div>
      </div>
      <button v-if="!isMobileDevice" class="reset-button" @click="handleResetRequest">
        ゲームをリセット
      </button>
    </div>

    <!-- クラッカーエフェクト -->
    <ConfettiEffect :is-active="showConfetti" />

    <!-- 結果表示モーダル -->
    <ResultModal
      :is-open="showResultModal"
      :result-text="gameResultText"
      :is-player-win="isPlayerWin"
      :player-count="playerCount"
      :opponent-count="opponentCount"
      :player-color="playerColor"
      :game-mode="props.gameMode"
      @close="closeResultModal"
      @reset-game="resetGame"
      @next-game="handleNextGame"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineExpose, defineEmits, defineProps, watch } from 'vue';
import ConfettiEffect from './ConfettiEffect.vue';
import ResultModal from './ResultModal.vue';
import type { CPULevel } from '../utils/CPUPlayer';
import { ReversiGameLogic } from '../utils/GameLogic/ReversiGameLogic';
import { FlipAnimationManager } from '../utils/Animation/FlipAnimationManager';
import { CPUController } from '../utils/GameLogic/CPUController';
import type { GameMode } from '../utils/GameLogic/constants';
import { BLACK, WHITE, EMPTY } from '../utils/GameLogic/constants';

/**
 * ゲーム画面ロジッククラス
 * 盤面・状態・UI制御を担う
 */
const props = defineProps<{
  gameMode: GameMode;
  cpuLevel: CPULevel;
  cpu2Level: CPULevel;
}>();

const emit = defineEmits<{
  (e: 'reset-request' | 'next-game-request'): void;
}>();

const isMobileDevice = ref<boolean>(false);

const detectDeviceType = (): void => {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent || navigator.vendor;
    isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }
};

const gameLogic = new ReversiGameLogic();
const animationManager = new FlipAnimationManager();
const cpuController = ref(new CPUController(gameLogic));
const board = ref<number[][]>(gameLogic.getBoard());
const boardCount = ref<{black: number, white: number}>({ black: 2, white: 2 });

watch(board, () => {
  boardCount.value = {
    black: gameLogic.getBlackCount(),
    white: gameLogic.getWhiteCount(),
  };
}, { immediate: true, deep: true });

const playerColor = ref<number>(BLACK);
const showResultModal = ref<boolean>(false);
const showConfetti = ref<boolean>(false);
const boardRef = ref<HTMLElement | null>(null);

const playerColorClass = computed((): string => {
  return playerColor.value === BLACK ? 'black-icon' : 'white-icon';
});

const opponentColorClass = computed((): string => {
  return playerColor.value === BLACK ? 'white-icon' : 'black-icon';
});

const playerCount = computed((): number => {
  return playerColor.value === BLACK ? boardCount.value.black : boardCount.value.white;
});

const opponentCount = computed((): number => {
  return playerColor.value === BLACK ? boardCount.value.white : boardCount.value.black;
});

const isPlayerWin = computed((): boolean => {
  return playerCount.value > opponentCount.value;
});

const gameResultText = computed((): string => {
  if (isPlayerWin.value) {
    return 'あなたの勝ち！';
  } else if (opponentCount.value > playerCount.value) {
    return '相手の勝ち！';
  } else {
    return '引き分け';
  }
});

const playerDisplayName = computed((): string => {
  switch (cpuController.value.gameMode) {
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

const opponentDisplayName = computed((): string => {
  switch (cpuController.value.gameMode) {
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

const initializeBoard = (): void => {
  gameLogic.initializeBoard();
  playerColor.value = Math.random() < 0.5 ? BLACK : WHITE;
  board.value = JSON.parse(JSON.stringify(gameLogic.getBoard()));
  animationManager.reset();
  showResultModal.value = false;
  showConfetti.value = false;
};

const handleOpponentTurn = async (): Promise<void> => {
  if (!cpuController.value.isPlayerVsCPUMode() || gameLogic.isGameOver() || animationManager.isAnimating.value) return;
  if (gameLogic.getCurrentPlayer() === playerColor.value) return;
  try {
    animationManager.setAnimating(true);
    const move = await cpuController.value.decideCPUMove(gameLogic.getCurrentPlayer());
    if (gameLogic.isGameOver()) {
      animationManager.setAnimating(false);
      return;
    }
    if (move) {
      await internalMakeMove(move.row, move.col);
    } else {
      handleNoValidMoves();
    }
  } finally {
    animationManager.setAnimating(false);
  }
};

const handleCPUvsCPUTurn = async (): Promise<void> => {
  if (!cpuController.value.isCPUvsCPUMode() || gameLogic.isGameOver() || animationManager.isAnimating.value) return;
  try {
    const currentPlayer = gameLogic.getCurrentPlayer();
    animationManager.setAnimating(true);
    const move = await cpuController.value.decideCPUMove(currentPlayer);
    if (move) {
      await internalMakeMove(move.row, move.col);
      if (!gameLogic.isGameOver()) {
        setTimeout(() => handleCPUvsCPUTurn(), 300);
      }
    } else {
      handleNoValidMoves();
      if (!gameLogic.isGameOver()) {
        setTimeout(() => handleCPUvsCPUTurn(), 300);
      }
    }
  } finally {
    animationManager.setAnimating(false);
  }
};

const handleNoValidMoves = (): void => {
  const canContinue = gameLogic.nextTurn();
  board.value = gameLogic.getBoard();
  if (!canContinue || gameLogic.isGameOver()) {
    showGameResult();
  }
};

const internalMakeMove = async (row: number, col: number): Promise<void> => {
  if (!gameLogic.canPlaceAt(row, col)) return;
  animationManager.setAnimating(true);
  const flippablePieces = gameLogic.placeStone(row, col);
  board.value = gameLogic.getBoard();
  await animationManager.animateFlip({ row, col }, flippablePieces);
  const canContinue = gameLogic.nextTurn();
  board.value = gameLogic.getBoard();
  if (!canContinue || gameLogic.isGameOver()) {
    showGameResult();
    return;
  }
  if (cpuController.value.isCPUvsCPUMode()) return;
  if (cpuController.value.isPlayerVsCPUMode()) handleOpponentTurn();
};

const makeMove = async (row: number, col: number): Promise<void> => {
  if (gameLogic.isGameOver() || animationManager.isAnimating.value) return;
  if (cpuController.value.isPlayerVsCPUMode() && gameLogic.getCurrentPlayer() !== playerColor.value) return;
  if (cpuController.value.isCPUvsCPUMode()) return;
  await internalMakeMove(row, col);
};

const showGameResult = (): void => {
  setTimeout(() => {
    showResultModal.value = true;
    if (isPlayerWin.value) {
      showConfetti.value = true;
      setTimeout(() => {
        showConfetti.value = false;
      }, 3000);
    }
  }, 500);
};

const closeResultModal = (): void => {
  showResultModal.value = false;
};

const resetGame = (): void => {
  initializeBoard();
  setupGame();
  if (cpuController.value.isPlayerVsCPUMode()) {
    handleOpponentTurn();
  } else if (cpuController.value.isCPUvsCPUMode()) {
    setTimeout(() => {
      handleCPUvsCPUTurn();
    }, 500);
  }
};

const setupGame = (): void => {
  try {
    cpuController.value.updateSettings(props.gameMode, props.cpuLevel, props.cpu2Level);
    board.value = JSON.parse(JSON.stringify(gameLogic.getBoard()));
  } catch (error) {
    console.error('ゲーム設定の初期化中にエラーが発生しました:', error);
  }
};

const skipToEndGame = (): void => {
  if (animationManager.isAnimating.value) return;
  animationManager.setAnimating(true);
  const remainingEmptyCells = board.value.flat().filter(cell => cell === EMPTY).length;
  if (remainingEmptyCells <= 2) {
    animationManager.setAnimating(false);
    return;
  }
  gameLogic.generateEndGamePosition(2);
  board.value = gameLogic.getBoard();
  setTimeout(() => {
    if (!gameLogic.hasValidMove(gameLogic.getCurrentPlayer())) {
      const opponent = gameLogic.getCurrentPlayer() === BLACK ? WHITE : BLACK;
      if (!gameLogic.hasValidMove(opponent)) {
        gameLogic.endGame();
        showGameResult();
      }
    }
    animationManager.setAnimating(false);
  }, 500);
};

const forceGameEnd = (): void => {
  gameLogic.endGame();
  showGameResult();
};

const setPlayer = (playerNum: number): void => {
  if (playerNum !== BLACK && playerNum !== WHITE) return;
  gameLogic.setCurrentPlayer(playerNum);
  board.value = gameLogic.getBoard();
};

defineExpose({
  resetGame,
});

watch(
  [() => props.gameMode, () => props.cpuLevel, () => props.cpu2Level],
  ([newGameMode, newCpuLevel, newCpu2Level]) => {
    initializeBoard();
    cpuController.value = new CPUController(gameLogic);
    cpuController.value.updateSettings(newGameMode, newCpuLevel, newCpu2Level);
    board.value = JSON.parse(JSON.stringify(gameLogic.getBoard()));
    if (cpuController.value.isPlayerVsCPUMode()) {
      setTimeout(() => handleOpponentTurn(), 50);
    } else if (cpuController.value.isCPUvsCPUMode()) {
      setTimeout(() => handleCPUvsCPUTurn(), 50);
    }
  },
  { immediate: true },
);

onMounted(() => {
  initializeBoard();
  detectDeviceType();
  window.addEventListener('resize', detectDeviceType);
  if (typeof window !== 'undefined') {
    window.__reversiDebug = {
      skipToEndGame,
      forceGameEnd,
      setPlayer,
    };
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', detectDeviceType);
  if (typeof window !== 'undefined') {
    delete window.__reversiDebug;
  }
});

declare global {
  interface Window {
    __reversiDebug?: any;
  }
}

const isValidMove = (row: number, col: number): boolean => {
  if (gameLogic.isGameOver()) return false;
  if (!gameLogic.canPlaceAt(row, col)) return false;
  if (cpuController.value.isPlayerVsCPUMode() && gameLogic.getCurrentPlayer() !== playerColor.value) return false;
  if (cpuController.value.isCPUvsCPUMode()) return false;
  return true;
};

const handleResetRequest = (): void => {
  emit('reset-request');
};

const handleNextGame = (): void => {
  emit('next-game-request');
};
</script>
<style scoped>
.reversi-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.board-container {
  background-color: var(--board-color);
  padding: 8px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  width: min(600px, 80vmin, calc(100vw - 40px), calc(100vh - 180px));
  height: min(600px, 80vmin, calc(100vw - 40px), calc(100vh - 180px));

  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.board-row {
  display: flex;
  flex: 1;
}

.board-cell {
  aspect-ratio: 1;
  flex: 1;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1B5E20;
  cursor: default;
  box-sizing: border-box;
}

.piece {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
}

.piece-black {
  background-color: var(--black-piece);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.piece-white {
  background-color: var(--white-piece);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.flipping {
  animation: flip-piece 0.35s cubic-bezier(0.42, 0, 0.58, 1);
}

@keyframes flip-piece {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
    box-shadow: none;
  }
  100% {
    transform: rotateY(0deg);
  }
}

.valid-move {
  position: relative;
  cursor: pointer;
}

.valid-move-indicator {
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  position: absolute;
}

.game-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
}

.top-info {
  margin-bottom: 15px;
}

.bottom-info {
  margin-top: 15px;
}

.score {
  width: 100%;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 5px 15px;
  border-radius: 4px;
  box-sizing: border-box;
  max-width: 200px;
  transition: background-color 0.6s ease, box-shadow 0.6s ease;
  margin: 0;
}

.score-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.score-icon-and-count {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rotated {
  transform: rotate(180deg);
}

.score-text {
  white-space: nowrap;
}

.count-display {
  display: inline-block;
  min-width: 24px;
  text-align: right;
}

.current-turn {
  background-color: rgba(76, 175, 80, 0.3);
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
}

.color-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 10px;
}

.black-icon {
  background-color: var(--black-piece, #000);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.white-icon {
  background-color: var(--white-piece, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid #ccc;
}

.reset-button {
  margin-top: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 15px;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-button:hover {
  background-color: #388E3C;
}
</style>
