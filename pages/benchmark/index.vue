<template>
  <div class="benchmark-container">
    <h1>リバーシCPUプレイヤー ベンチマーク</h1>

    <div class="settings-container">
      <h2>ベンチマーク設定</h2>

      <div v-if="needsUltimateModel" class="model-status">
        <div v-if="isModelLoading" class="loading-indicator">
          <div class="spinner" />
          <span>最強CPUのモデルを読み込み中...</span>
        </div>
        <div v-else-if="isModelLoaded" class="success-message">
          <span>✓ 最強CPUのモデルの読み込みが完了しました</span>
        </div>
        <div v-else class="error-message">
          <span>⚠ 最強CPUのモデルが読み込まれていません。読み込みボタンを押してください。</span>
          <button :disabled="isModelLoading" @click="onClickLoadModel">モデルを読み込む</button>
        </div>
      </div>

      <div class="setting-row">
        <label for="black-level">黒CPUの難易度:</label>
        <div class="custom-select-wrapper small">
          <select id="black-level" v-model="blackLevel" class="custom-select small">
            <option :value="CPULevel.EASY">イージー</option>
            <option :value="CPULevel.MEDIUM">ミディアム</option>
            <option :value="CPULevel.HARD">ハード</option>
            <option :value="CPULevel.ULTIMATE">アルティメット（最強CPU）</option>
          </select>
          <span class="custom-arrow"/>
        </div>
      </div>

      <div class="setting-row">
        <label for="white-level">白CPUの難易度:</label>
        <div class="custom-select-wrapper small">
          <select id="white-level" v-model="whiteLevel" class="custom-select small">
            <option :value="CPULevel.EASY">イージー</option>
            <option :value="CPULevel.MEDIUM">ミディアム</option>
            <option :value="CPULevel.HARD">ハード</option>
            <option :value="CPULevel.ULTIMATE">アルティメット（最強CPU）</option>
          </select>
          <span class="custom-arrow"/>
        </div>
      </div>

      <div class="setting-row">
        <label for="num-games">対戦回数:</label>
        <div class="custom-input-wrapper small">
          <input id="num-games" v-model.number="numGames" type="number" min="1" max="100" class="custom-input small" >
        </div>
      </div>

      <button :disabled="isRunning || shouldDisableStartButton" @click="onClickStartBenchmark">ベンチマーク実行</button>
    </div>

    <div v-if="isRunning" class="results-container">
      <h2>ベンチマーク結果</h2>
      <div class="progress-container">
        <p>進行状況: {{ Math.round(progress * 100) }}% ({{ completedGames }}/{{ numGames }})</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress * 100 + '%' }" />
        </div>
      </div>
    </div>

    <div v-if="benchmarkLogs.length > 0" class="benchmark-log-list">
      <h2>ベンチマーク履歴</h2>
      <div v-for="log in benchmarkLogs" :key="log.timestamp" class="results-container log-entry">
        <div class="result-stats unified">
          <h3>黒CPU({{ log.blackLevel }})・白CPU({{ log.whiteLevel }})</h3>
          <div class="result-row">
            <div class="result-col">
              <div class="result-label">勝率</div>
              <div class="result-value">黒: {{ log.result.blackWinRate.toFixed(2) }}% ({{ log.result.blackWins }}勝)</div>
              <div class="result-value">白: {{ log.result.whiteWinRate.toFixed(2) }}% ({{ log.result.whiteWins }}勝)</div>
              <div class="result-value">引き分け: {{ log.result.drawRate.toFixed(2) }}% ({{ log.result.draws }}回)</div>
            </div>
            <div class="result-col">
              <div class="result-label">平均石数</div>
              <div class="result-value">黒: {{ log.result.blackAvgStones.toFixed(1) }}</div>
              <div class="result-value">白: {{ log.result.whiteAvgStones.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import * as tf from '@tensorflow/tfjs';
import { BLACK, WHITE, EMPTY } from '../../utils/GameLogic/constants';
import { CPUPlayer, CPULevel } from '../../utils/CPUPlayer';
import { UltimateCPUPlayer } from '../../utils/CPUPlayer/UltimateCPUPlayer';

/**
 * ベンチマーク結果型
 */
type BenchmarkResult = {
  blackWins: number;
  whiteWins: number;
  draws: number;
  blackWinRate: number;
  whiteWinRate: number;
  drawRate: number;
  blackAvgStones: number;
  whiteAvgStones: number;
};

/**
 * ベンチマーク履歴ログ型
 */
type BenchmarkLog = {
  blackLevel: CPULevel;
  whiteLevel: CPULevel;
  numGames: number;
  timestamp: string;
  result: BenchmarkResult;
};

/**
 * モデルロード状態を管理する型
 */
type ModelLoadState = {
  isLoading: ReturnType<typeof ref<boolean>>;
  isLoaded: ReturnType<typeof ref<boolean>>;
  player: UltimateCPUPlayer | null;
};

/**
 * ベンチマークページ状態管理クラス
 */
class BenchmarkState {
  black: ModelLoadState = { isLoading: ref(false), isLoaded: ref(false), player: null };
  white: ModelLoadState = { isLoading: ref(false), isLoaded: ref(false), player: null };
  blackLevel = ref<CPULevel>(CPULevel.MEDIUM);
  whiteLevel = ref<CPULevel>(CPULevel.MEDIUM);
  numGames = ref<number>(10);
  isRunning = ref(false);
  progress = ref(0);
  completedGames = ref(0);
}

const state = new BenchmarkState();
const blackLevel = state.blackLevel;
const whiteLevel = state.whiteLevel;
const numGames = state.numGames;
const isRunning = computed(() => state.isRunning.value);
const progress = computed(() => state.progress.value);
const completedGames = computed(() => state.completedGames.value);
const benchmarkLogs = ref<BenchmarkLog[]>([]);

const needsUltimateModel = computed(() => {
  return blackLevel.value === CPULevel.ULTIMATE || whiteLevel.value === CPULevel.ULTIMATE;
});

const isModelLoading = computed(() => state.black.isLoading.value || state.white.isLoading.value);
const isModelLoaded = computed(() => {
  if (!needsUltimateModel.value) {
    return true;
  }
  return (
    (blackLevel.value !== CPULevel.ULTIMATE || state.black.isLoaded.value) &&
    (whiteLevel.value !== CPULevel.ULTIMATE || state.white.isLoaded.value)
  );
});

const shouldDisableStartButton = computed(() => {
  void isModelLoaded.value;
  if (!needsUltimateModel.value) {
    return false;
  }
  if (blackLevel.value === CPULevel.ULTIMATE && !state.black.isLoaded.value) {
    return true;
  }
  if (whiteLevel.value === CPULevel.ULTIMATE && !state.white.isLoaded.value) {
    return true;
  }
  return false;
});

watch(blackLevel, (newLevel) => {
  if (newLevel === CPULevel.ULTIMATE && !state.black.player?.isModelReady()) {
    state.black.isLoaded.value = false;
  }
});

watch(whiteLevel, (newLevel) => {
  if (newLevel === CPULevel.ULTIMATE && !state.white.player?.isModelReady()) {
    state.white.isLoaded.value = false;
  }
});

onMounted(async () => {
  await tf.ready();
  if (blackLevel.value === CPULevel.ULTIMATE) {
    await loadUltimateModel('black');
  }
  if (whiteLevel.value === CPULevel.ULTIMATE) {
    await loadUltimateModel('white');
  }
});

/**
 * モデルロード状態を取得します。
 */
function getModelState(color: 'black' | 'white'): ModelLoadState {
  return color === 'black' ? state.black : state.white;
}

/**
 * 最強CPUモデルをロードします。
 */
async function loadUltimateModel(color: 'black' | 'white'): Promise<void> {
  const modelState = getModelState(color);
  if (modelState.player?.isModelReady() || modelState.isLoading.value) {
    return;
  }
  modelState.isLoading.value = true;
  try {
    modelState.player = new UltimateCPUPlayer();
    const waitModelReady = async () => {
      if (modelState.player && modelState.player.isModelReady()) {
        modelState.isLoaded.value = true;
        modelState.isLoading.value = false;
        return;
      }
      if (modelState.player && modelState.player.hasModelLoadFailed()) {
        modelState.isLoaded.value = false;
        modelState.isLoading.value = false;
        return;
      }
      setTimeout(waitModelReady, 500);
    };
    setTimeout(waitModelReady, 500);
  } catch {
    modelState.isLoading.value = false;
    modelState.isLoaded.value = false;
  }
}

/**
 * モデルロードボタン押下時の処理です。
 */
function onClickLoadModel(): void {
  if (blackLevel.value === CPULevel.ULTIMATE && !state.black.isLoaded.value) {
    loadUltimateModel('black');
  }
  if (whiteLevel.value === CPULevel.ULTIMATE && !state.white.isLoaded.value) {
    loadUltimateModel('white');
  }
}

/**
 * ベンチマーク実行ボタン押下時の処理です。
 */
async function onClickStartBenchmark(): Promise<void> {
  await runBenchmark();
}

function createInitialBoard(): number[][] {
  const board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  return board;
}

async function hasValidMoves(board: number[][], player: number, cpu: CPUPlayer): Promise<boolean> {
  const move = await cpu.selectMove(board, player);
  return move !== null;
}

async function isGameOver(board: number[][], cpu1: CPUPlayer, cpu2: CPUPlayer): Promise<boolean> {
  const blackHas = await hasValidMoves(board, BLACK, cpu1);
  const whiteHas = await hasValidMoves(board, WHITE, cpu2);
  return !blackHas && !whiteHas;
}

function getResult(board: number[][]): { winner: number; black: number; white: number } {
  const flat = board.flat();
  const black = flat.filter(c => c === BLACK).length;
  const white = flat.filter(c => c === WHITE).length;
  let winner = EMPTY;
  if (black > white) {
    winner = BLACK;
  } else if (white > black) {
    winner = WHITE;
  }
  return { winner, black, white };
}

async function playGame(cpuBlack: CPUPlayer, cpuWhite: CPUPlayer): Promise<{ winner: number; black: number; white: number }> {
  const board = createInitialBoard();
  let current = BLACK;
  let pass = 0;
  while (!await isGameOver(board, cpuBlack, cpuWhite)) {
    const cpu = current === BLACK ? cpuBlack : cpuWhite;
    const move = await cpu.selectMove(board, current);
    if (move === null) {
      pass++;
    } else {
      pass = 0;
      board[move.row][move.col] = current;
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      const opp = current === BLACK ? WHITE : BLACK;
      for (const [dx, dy] of dirs) {
        let x = move.row + dx;
        let y = move.col + dy;
        const flips: [number, number][] = [];
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opp) {
          flips.push([x, y]);
          x += dx;
          y += dy;
        }
        if (flips.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === current) {
          for (const [fx, fy] of flips) {
            board[fx][fy] = current;
          }
        }
      }
    }
    if (pass >= 2) break;
    current = current === BLACK ? WHITE : BLACK;
  }
  return getResult(board);
}

async function runBenchmark(): Promise<void> {
  state.isRunning.value = true;
  state.progress.value = 0;
  state.completedGames.value = 0;

  const cpuBlack = blackLevel.value === CPULevel.ULTIMATE
    ? (state.black.player || new CPUPlayer(CPULevel.ULTIMATE))
    : new CPUPlayer(blackLevel.value);
  const cpuWhite = whiteLevel.value === CPULevel.ULTIMATE
    ? (state.white.player || new CPUPlayer(CPULevel.ULTIMATE))
    : new CPUPlayer(whiteLevel.value);

  let blackWins = 0, whiteWins = 0, draws = 0;
  let blackStones = 0, whiteStones = 0;

  for (let i = 0; i < numGames.value; i++) {
    const r = await playGame(cpuBlack, cpuWhite);
    if (r.winner === EMPTY) {
      draws++;
    } else if (r.winner === BLACK) {
      blackWins++;
    } else {
      whiteWins++;
    }
    blackStones += r.black;
    whiteStones += r.white;
    state.completedGames.value = i + 1;
    state.progress.value = (i + 1) / numGames.value;
    await new Promise(res => setTimeout(res, 0));
  }

  const n = numGames.value;
  const result: BenchmarkResult = {
    blackWins,
    whiteWins,
    draws,
    blackWinRate: (blackWins / n) * 100,
    whiteWinRate: (whiteWins / n) * 100,
    drawRate: (draws / n) * 100,
    blackAvgStones: blackStones / n,
    whiteAvgStones: whiteStones / n,
  };

  benchmarkLogs.value.unshift({
    blackLevel: blackLevel.value,
    whiteLevel: whiteLevel.value,
    numGames: numGames.value,
    timestamp: new Date().toLocaleString(),
    result,
  });

  state.isRunning.value = false;
}
</script>

<style scoped>
.benchmark-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-container, .results-container {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-row label {
  min-width: 150px;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.progress-container {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.result-stats {
  display: flex;
  gap: 20px;
}

.result-stats.unified {
  background-color: white;
  padding: 18px 18px 10px 18px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-stats.unified h3 {
  margin: 0 0 10px 0;
  font-size: 17px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 8px;
}

.result-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.result-col {
  min-width: 140px;
  flex: 1;
}

.result-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 4px;
}

.result-value {
  font-size: 15px;
  margin-bottom: 2px;
}

.stat-item {
  flex: 1;
  background-color: white;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-item h3 {
  margin-top: 0;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 10px;
}

.model-status {
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 4px;
  background-color: #f8f8f8;
}

.loading-indicator {
  display: flex;
  align-items: center;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-message {
  color: #4CAF50;
}

.error-message {
  color: #f44336;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-message button {
  align-self: flex-start;
  margin: 0;
}

.custom-select-wrapper {
  position: relative;
  display: inline-block;
  width: 200px;
}
.custom-select-wrapper.small {
  width: 120px;
}
.custom-select {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  appearance: none;
  font-size: 16px;
  transition: border-color 0.2s;
  outline: none;
}
.custom-select.small {
  padding: 6px 28px 6px 8px;
  font-size: 14px;
}
.custom-arrow {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 0;
  height: 0;
  pointer-events: none;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #888;
  transform: translateY(-50%);
}
.custom-input-wrapper.small {
  width: 80px;
  display: inline-block;
}
.custom-input.small {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
}
.custom-input.small:focus {
  border-color: #4CAF50;
}
.rate-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}
.benchmark-log-list {
  margin-top: 40px;
}

.log-entry {
  margin-bottom: 24px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
</style>
