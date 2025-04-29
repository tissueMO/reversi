<template>
  <div class="reversi-board fade-in">
    <div class="game-info top-info">
      <div class="score player2-score" :class="{ 'current-turn': !gameLogic.isGameOver() && gameLogic.getCurrentPlayer() !== player1Color }">
        <div class="score-content">
          <div class="score-icon-and-count" :class="{ 'rotated': isMobileDevice }">
            <div class="color-icon" :class="player2ColorClass" />
            <div class="score-text">
              {{ player2DisplayName }}: <span class="count-display">{{ player2Count }}</span>
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
          :class="{ 'valid-move': isValidMove(rowIndex, colIndex) && !flipAnimator.isAnimating.value }"
          @click="makeMove(rowIndex, colIndex)"
        >
          <div
            v-if="cell !== EMPTY"
            class="piece"
            :class="{
              'piece-black': cell === BLACK,
              'piece-white': cell === WHITE,
              'flipping': flipAnimator.isFlipping(rowIndex, colIndex),
            }"
          />
          <div v-else-if="isValidMove(rowIndex, colIndex) && !flipAnimator.isAnimating.value" class="valid-move-indicator" />
        </div>
      </div>
    </div>
    <div class="game-info bottom-info">
      <div class="score player1-score" :class="{ 'current-turn': !gameLogic.isGameOver() && gameLogic.getCurrentPlayer() === player1Color }">
        <div class="score-content">
          <div class="score-icon-and-count">
            <div class="color-icon" :class="player1ColorClass" />
            <div class="score-text">
              {{ player1DisplayName }}: <span class="count-display">{{ player1Count }}</span>
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
      :player1-count="player1Count"
      :player2-count="player2Count"
      :player1-color="player1Color"
      :player2-color="player2Color"
      :game-mode="props.gameMode"
      @close="closeResultModal"
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

const props = defineProps<{
  gameMode: GameMode;
  cpu1Level: CPULevel;
  cpu2Level: CPULevel;
}>();

const emit = defineEmits<{
  (e: 'reset-request' | 'next-game-request'): void;
}>();

declare global {
  interface Window {
    __reversiDebug?: any;
  }
}

const isMobileDevice = ref<boolean>(false);
const detectDeviceType = (): void => {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent || navigator.vendor;
    isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }
};

const gameVersion = ref<number>(0);
const gameLogic = new ReversiGameLogic();
const flipAnimator = new FlipAnimationManager();
const cpuController = ref(new CPUController(gameLogic));
const board = ref<number[][]>(gameLogic.getBoard());

const boardCount = ref<{black: number, white: number}>({ black: 2, white: 2 });
watch(board, () => {
  boardCount.value = {
    black: gameLogic.getBlackCount(),
    white: gameLogic.getWhiteCount(),
  };
}, { immediate: true, deep: true });

const showResultModal = ref<boolean>(false);
const showConfetti = ref<boolean>(false);

const player1Color = ref<number>(BLACK);
const player2Color = computed((): number => player1Color.value === BLACK ? WHITE : BLACK);

const player1ColorClass = computed((): string => {
  return player1Color.value === BLACK ? 'black-icon' : 'white-icon';
});
const player2ColorClass = computed((): string => {
  return player2Color.value === BLACK ? 'black-icon' : 'white-icon';
});

const player1Count = computed((): number => {
  return player1Color.value === BLACK ? boardCount.value.black : boardCount.value.white;
});
const player2Count = computed((): number => {
  return player2Color.value === BLACK ? boardCount.value.black : boardCount.value.white;
});

const player1DisplayName = computed((): string => {
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
const player2DisplayName = computed((): string => {
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

let cpuTurnTimer: ReturnType<typeof setTimeout> | null = null;

const clearCPUTurnTimeout = (): void => {
  clearTimeout(cpuTurnTimer);
  cpuTurnTimer = null;
};

const startCPUTurnIfNeeded = (): void => {
  clearCPUTurnTimeout();

  if (flipAnimator.isAnimating.value || gameLogic.isGameOver()) {
    return;
  }

  if (cpuController.value.isCPUvsCPUMode()) {
    cpuTurnTimer = setTimeout(() => handleCPUVsCPUTurn(), 50);
  } else if (cpuController.value.isPlayerVsCPUMode() && gameLogic.getCurrentPlayer() !== player1Color.value) {
    cpuTurnTimer = setTimeout(() => handlePlayer2CPUTurn(), 50);
  }
};

const initializeBoard = (): void => {
  clearCPUTurnTimeout();
  gameLogic.initializeBoard();
  player1Color.value = Math.random() < 0.5 ? BLACK : WHITE;
  board.value = gameLogic.getBoard();
  flipAnimator.reset();
  showResultModal.value = false;
  showConfetti.value = false;
};

const handlePlayer2CPUTurn = async (): Promise<void> => {
  if (
    (!cpuController.value.isPlayerVsCPUMode() || gameLogic.isGameOver() || flipAnimator.isAnimating.value) ||
    gameLogic.getCurrentPlayer() === player1Color.value
  ) {
    return;
  }

  flipAnimator.setAnimating(true);

  const move = await cpuController.value.decideCPUMove(gameLogic.getCurrentPlayer());
  if (move) {
    await internalMakeMove(move.row, move.col);
  } else {
    handleNoValidMoves();
  }

  flipAnimator.setAnimating(false);
};

const handleCPUVsCPUTurn = async (): Promise<void> => {
  if (!cpuController.value.isCPUvsCPUMode() || gameLogic.isGameOver() || flipAnimator.isAnimating.value) {
    return;
  }

  flipAnimator.setAnimating(true);

  const move = await cpuController.value.decideCPUMove(gameLogic.getCurrentPlayer());
  if (move) {
    await internalMakeMove(move.row, move.col);
  } else {
    handleNoValidMoves();
  }

  flipAnimator.setAnimating(false);
};

const handleNoValidMoves = (): void => {
  if (!gameLogic.nextTurn() || gameLogic.isGameOver()) {
    showGameResult();
  }
};

const internalMakeMove = async (row: number, col: number): Promise<void> => {
  if (!gameLogic.canPlaceAt(row, col)) {
    return;
  }

  const currentVersion = gameVersion.value;

  flipAnimator.setAnimating(true);

  const flippablePieces = gameLogic.placeStone(row, col);
  board.value = gameLogic.getBoard();
  await flipAnimator.animateFlip({ row, col }, flippablePieces);

  // ※アニメーション中にゲームリセットされたら中止する
  if (gameVersion.value !== currentVersion) {
    flipAnimator.setAnimating(false);
    return;
  }

  board.value = gameLogic.getBoard();
  flipAnimator.setAnimating(false);

  // ※ゲームが終了したら中止する
  if (!gameLogic.nextTurn() || gameLogic.isGameOver()) {
    showGameResult();
    return;
  }

  // 次の手番がCPUならCPU思考を開始
  clearCPUTurnTimeout();
  if (cpuController.value.isPlayerVsCPUMode() && gameLogic.getCurrentPlayer() !== player1Color.value) {
    cpuTurnTimer = setTimeout(() => handlePlayer2CPUTurn(), 50);
    return;
  }
  if (cpuController.value.isCPUvsCPUMode()) {
    cpuTurnTimer = setTimeout(() => handleCPUVsCPUTurn(), 50);
    return;
  }
};

const makeMove = async (row: number, col: number): Promise<void> => {
  if (
    (gameLogic.isGameOver() || flipAnimator.isAnimating.value) ||
    (cpuController.value.isPlayerVsCPUMode() && gameLogic.getCurrentPlayer() !== player1Color.value) ||
    cpuController.value.isCPUvsCPUMode()
  ) {
    return;
  }

  await internalMakeMove(row, col);
};

const showGameResult = (): void => {
  setTimeout(() => {
    showResultModal.value = true;

    const show =
      (props.gameMode === 'twoPlayers' && player1Count.value !== player2Count.value) ||
      (props.gameMode === 'playerVsCPU' && player1Count.value > player2Count.value);

    showConfetti.value = show;

    if (show) {
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
  clearCPUTurnTimeout();
  initializeBoard();
  setupGame();
  startCPUTurnIfNeeded();
};

const setupGame = (): void => {
  cpuController.value.updateSettings(props.gameMode, props.cpu1Level, props.cpu2Level);
  board.value = gameLogic.getBoard();
  gameVersion.value++;
};

/**
 * [デバッグ用] 残りn手前まで盤面を進めます。
 */
const skipToEnding = (n: number = 2, player?: number): void => {
  if (flipAnimator.isAnimating.value) {
    return;
  }

  flipAnimator.setAnimating(true);

  const remainingEmptyCells = board.value.flat().filter(cell => cell === EMPTY).length;
  if (remainingEmptyCells <= n) {
    flipAnimator.setAnimating(false);
    return;
  }
  gameLogic.generateEndingBoard(n, player);
  board.value = gameLogic.getBoard();

  setTimeout(() => {
    if (!gameLogic.hasValidMove(gameLogic.getCurrentPlayer())) {
      const opponent = gameLogic.getCurrentPlayer() === BLACK ? WHITE : BLACK;
      if (!gameLogic.hasValidMove(opponent)) {
        gameLogic.endGame();
        showGameResult();
      }
    }
    flipAnimator.setAnimating(false);
  }, 500);
};

/**
 * [デバッグ用] 強制的にゲームを終了します。
 */
const forceGameEnd = (): void => {
  gameLogic.endGame();
  showGameResult();
};

/**
 * [デバッグ用] 強制的に手番を変更します。
 */
const setPlayer = (player: number): void => {
  if (player === BLACK || player === WHITE) {
    gameLogic.setCurrentPlayer(player);
    board.value = gameLogic.getBoard();
  }
};

watch(
  [() => props.gameMode, () => props.cpu1Level, () => props.cpu2Level],
  ([newGameMode, newCpuLevel, newCpu2Level]) => {
    initializeBoard();
    cpuController.value = new CPUController(gameLogic);
    cpuController.value.updateSettings(newGameMode, newCpuLevel, newCpu2Level);
    board.value = gameLogic.getBoard();
  },
  { immediate: true },
);

onMounted(() => {
  initializeBoard();

  detectDeviceType();
  window.addEventListener('resize', detectDeviceType);

  if (typeof window !== 'undefined') {
    window.__reversiDebug = {
      skipToEnding,
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

const isValidMove = (row: number, col: number): boolean => {
  return (
    !gameLogic.isGameOver() &&
    gameLogic.canPlaceAt(row, col) &&
    (!cpuController.value.isPlayerVsCPUMode() || gameLogic.getCurrentPlayer() !== player2Color.value) &&
    !cpuController.value.isCPUvsCPUMode()
  );
};

const handleResetRequest = (): void => {
  emit('reset-request');
};
const handleNextGame = (): void => {
  emit('next-game-request');
};

defineExpose({
  resetGame,
});
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
