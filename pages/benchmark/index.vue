<template>
  <div class="benchmark-container">
    <h1>リバーシCPUプレイヤー ベンチマーク</h1>

    <div class="settings-container">
      <h2>ベンチマーク設定</h2>

      <!-- モデル読み込み状況の表示を追加 -->
      <div v-if="opponentLevel === CPULevel.ULTIMATE || ultimateIsBlack" class="model-status">
        <div v-if="isModelLoading" class="loading-indicator">
          <div class="spinner"/>
          <span>最強CPUのモデルを読み込み中...</span>
        </div>
        <div v-else-if="isModelLoaded" class="success-message">
          <span>✓ 最強CPUのモデルの読み込みが完了しました</span>
        </div>
        <div v-else class="error-message">
          <span>⚠ 最強CPUのモデルが読み込まれていません。読み込みボタンを押してください。</span>
          <button :disabled="isModelLoading" @click="loadUltimateModel">モデルを読み込む</button>
        </div>
      </div>

      <div class="setting-row">
        <label for="opponent-level">相手CPUの難易度:</label>
        <select id="opponent-level" v-model="opponentLevel">
          <option value="easy">イージー</option>
          <option value="medium">ミディアム</option>
          <option value="hard">ハード</option>
          <option value="ultimate">アルティメット（最強CPU同士の対決）</option>
        </select>
      </div>

      <div class="setting-row">
        <label for="num-games">対戦回数:</label>
        <input id="num-games" v-model="numGames" type="number" min="1" max="100" >
      </div>

      <div class="setting-row">
        <label for="ultimate-color">最強CPUの色:</label>
        <select id="ultimate-color" v-model="ultimateIsBlack">
          <option :value="true">黒（先手）</option>
          <option :value="false">白（後手）</option>
        </select>
      </div>

      <button :disabled="isRunning || shouldDisableStartButton" @click="startBenchmark">ベンチマーク実行</button>
    </div>

    <div v-if="showResults" class="results-container">
      <h2>ベンチマーク結果</h2>

      <div v-if="isRunning" class="progress-container">
        <p>進行状況: {{ Math.round(progress * 100) }}% ({{ completedGames }}/{{ numGames }})</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress * 100 + '%' }"/>
        </div>
      </div>

      <div v-if="benchmarkResults" class="results">
        <div class="result-summary">
          <p>最強CPU({{ CPULevel.ULTIMATE }}) vs 相手CPU({{ opponentLevel }})</p>
          <p>最強CPUの色: {{ ultimateIsBlack ? '黒(●)' : '白(○)' }}</p>
          <p>対戦回数: {{ numGames }}回</p>
        </div>

        <div class="result-stats">
          <div class="stat-item">
            <h3>勝率</h3>
            <p>最強CPU: {{ (benchmarkResults.ultimateWinRate).toFixed(2) }}% ({{ benchmarkResults.ultimateWins }}勝)</p>
            <p>相手CPU: {{ (benchmarkResults.opponentWinRate).toFixed(2) }}% ({{ benchmarkResults.opponentWins }}勝)</p>
            <p>引き分け: {{ (benchmarkResults.drawRate).toFixed(2) }}% ({{ benchmarkResults.draws }}回)</p>
          </div>

          <div class="stat-item">
            <h3>平均石数</h3>
            <p>最強CPU: {{ benchmarkResults.ultimateAvgStones.toFixed(1) }}</p>
            <p>相手CPU: {{ benchmarkResults.opponentAvgStones.toFixed(1) }}</p>
          </div>
        </div>

        <button @click="showResults = false">閉じる</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import * as tf from '@tensorflow/tfjs';
import { CPULevel, BLACK, WHITE, EMPTY } from '~/utils/CPUPlayer/types';
import { CPUPlayer } from '~/utils/CPUPlayer';
import { UltimateCPUPlayer } from '~/utils/CPUPlayer/UltimateCPUPlayer';

// TensorFlow.jsとモデルの初期化状態を管理
const isModelLoading = ref<boolean>(false);
const isModelLoaded = ref<boolean>(false);
let ultimatePlayer: UltimateCPUPlayer | null = null;

// 状態変数
const opponentLevel = ref<CPULevel>(CPULevel.MEDIUM);
const numGames = ref<number>(10);
const ultimateIsBlack = ref<boolean>(true);
const isRunning = ref<boolean>(false);
const progress = ref<number>(0);
const completedGames = ref<number>(0);
const showResults = ref<boolean>(false);
const benchmarkResults = ref<any>(null);

// 実行ボタンを無効にする条件の計算
const shouldDisableStartButton = computed(() => {
  const needsUltimateModel = opponentLevel.value === CPULevel.ULTIMATE || ultimateIsBlack.value;
  return needsUltimateModel && !isModelLoaded.value;
});

// TensorFlow.jsの初期化とモデルのロード
onMounted(async () => {
  await tf.ready();

  // 自動的にモデル読み込みを開始
  if (opponentLevel.value === CPULevel.ULTIMATE || ultimateIsBlack.value) {
    loadUltimateModel();
  }
});

// 最強CPUのモデルを読み込む関数
async function loadUltimateModel() {
  if (isModelLoading.value || isModelLoaded.value) return;

  isModelLoading.value = true;
  try {
    ultimatePlayer = new UltimateCPUPlayer();

    // モデルの読み込み完了を待機
    const checkModelLoaded = async () => {
      if (ultimatePlayer && ultimatePlayer.isModelReady()) {
        isModelLoaded.value = true;
        isModelLoading.value = false;
        return;
      }

      if (ultimatePlayer && ultimatePlayer.hasModelLoadFailed()) {
        isModelLoaded.value = false;
        isModelLoading.value = false;
        console.error('モデルの読み込みに失敗しました');
        return;
      }

      // まだ読み込み中の場合は再度チェック
      setTimeout(checkModelLoaded, 500);
    };

    // 初回チェック開始
    setTimeout(checkModelLoaded, 500);
  } catch (error) {
    console.error('モデルの読み込み初期化に失敗しました:', error);
    isModelLoading.value = false;
    isModelLoaded.value = false;
  }
}

// リバーシの初期盤面を作成
function createInitialBoard(): number[][] {
  // 8x8の空の盤面を作成（全てのマスをEMPTYで初期化）
  const board: number[][] = Array(8).fill(0).map(() => Array(8).fill(EMPTY));

  // 初期配置（中央4マスに石を配置）
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;

  return board;
}

// プレイヤーが有効な手を持っているか確認
async function hasValidMoves(board: number[][], player: number, cpuPlayer: CPUPlayer): Promise<boolean> {
  const move = await cpuPlayer.selectMove(board, player);
  return move !== null;
}

// ゲームが終了しているか確認
async function isGameOver(board: number[][], cpuPlayer1: CPUPlayer, cpuPlayer2: CPUPlayer): Promise<boolean> {
  const blackHasMove = await hasValidMoves(board, BLACK, cpuPlayer1);
  const whiteHasMove = await hasValidMoves(board, WHITE, cpuPlayer2);
  return !blackHasMove && !whiteHasMove;
}

// ゲームの勝者を判定
function determineWinner(board: number[][]): {winner: number, blackCount: number, whiteCount: number} {
  const blackCount = board.flat().filter(cell => cell === BLACK).length;
  const whiteCount = board.flat().filter(cell => cell === WHITE).length;

  let winner = EMPTY; // 引き分け
  if (blackCount > whiteCount) {
    winner = BLACK;
  } else if (whiteCount > blackCount) {
    winner = WHITE;
  }

  return { winner, blackCount, whiteCount };
}

// 単一のゲームをシミュレート
async function simulateGame(cpu1: CPUPlayer, cpu2: CPUPlayer): Promise<{winner: number, blackCount: number, whiteCount: number}> {
  // 初期盤面を作成
  const board = createInitialBoard();
  let currentPlayer = BLACK; // 黒から開始
  let passCount = 0; // 連続パス回数

  // ゲームループ
  while (!await isGameOver(board, cpu1, cpu2)) {
    // 現在のプレイヤーに対応するCPUを選択
    const currentCPU = currentPlayer === BLACK ? cpu1 : cpu2;

    // 次の手を選択
    const move = await currentCPU.selectMove(board, currentPlayer);

    if (move === null) {
      // 有効な手がない場合はパス
      passCount++;
    } else {
      // 手を適用
      passCount = 0; // パスカウントをリセット

      // 手の適用
      board[move.row][move.col] = currentPlayer;

      // ひっくり返す処理
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];

      const opponent = currentPlayer === BLACK ? WHITE : BLACK;

      for (const [dx, dy] of directions) {
        let x = move.row + dx;
        let y = move.col + dy;
        const flippablePieces = [];

        while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
          flippablePieces.push({row: x, col: y});
          x += dx;
          y += dy;
        }

        if (flippablePieces.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === currentPlayer) {
          flippablePieces.forEach(pos => {
            board[pos.row][pos.col] = currentPlayer;
          });
        }
      }
    }

    // 両プレイヤーが連続でパスした場合、ゲーム終了
    if (passCount >= 2) break;

    // 次のプレイヤーへ
    currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
  }

  // 勝者を判定
  return determineWinner(board);
}

// ベンチマーク実行
async function startBenchmark() {
  try {
    isRunning.value = true;
    progress.value = 0;
    completedGames.value = 0;
    showResults.value = true;

    // CPUプレイヤーの作成
    // すでに読み込まれている最強CPUプレイヤーを使用する
    const opponentPlayer = new CPUPlayer(opponentLevel.value);

    // 統計情報の初期化
    let ultimateWins = 0;
    let opponentWins = 0;
    let draws = 0;
    let ultimateTotalStones = 0;
    let opponentTotalStones = 0;

    // 各ゲームをシミュレート
    for (let i = 0; i < numGames.value; i++) {
      // CPUプレイヤーを適切に配置
      let blackPlayer;
      let whitePlayer;

      // 最強CPUプレイヤーを適切に配置
      if (ultimateIsBlack.value) {
        blackPlayer = ultimatePlayer || new CPUPlayer(CPULevel.ULTIMATE);
        whitePlayer = opponentPlayer;
      } else {
        blackPlayer = opponentPlayer;
        whitePlayer = ultimatePlayer || new CPUPlayer(CPULevel.ULTIMATE);
      }

      // ゲームシミュレーション
      const result = await simulateGame(blackPlayer, whitePlayer);

      // 勝敗の記録
      const ultimateStones = ultimateIsBlack.value ? result.blackCount : result.whiteCount;
      const opponentStones = ultimateIsBlack.value ? result.whiteCount : result.blackCount;

      if (result.winner === EMPTY) {
        draws++;
      } else if ((result.winner === BLACK && ultimateIsBlack.value) || (result.winner === WHITE && !ultimateIsBlack.value)) {
        ultimateWins++;
      } else {
        opponentWins++;
      }

      // 石の数を統計に追加
      ultimateTotalStones += ultimateStones;
      opponentTotalStones += opponentStones;

      // 進捗を更新
      completedGames.value = i + 1;
      progress.value = (i + 1) / numGames.value;

      // UIの更新のために少し待つ
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // 結果の計算
    const ultimateWinRate = (ultimateWins / numGames.value) * 100;
    const opponentWinRate = (opponentWins / numGames.value) * 100;
    const drawRate = (draws / numGames.value) * 100;
    const ultimateAvgStones = ultimateTotalStones / numGames.value;
    const opponentAvgStones = opponentTotalStones / numGames.value;

    // 結果の設定
    benchmarkResults.value = {
      ultimateWins,
      opponentWins,
      draws,
      ultimateWinRate,
      opponentWinRate,
      drawRate,
      ultimateAvgStones,
      opponentAvgStones,
    };
  } finally {
    isRunning.value = false;
  }
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

.result-summary {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
}

.result-stats {
  display: flex;
  gap: 20px;
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
</style>
