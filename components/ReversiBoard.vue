<template>
  <div class="reversi-board">
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
          :class="{ 'valid-move': isValidMove(rowIndex, colIndex) }"
          @click="makeMove(rowIndex, colIndex)"
        >
          <div
            v-if="cell !== 0"
            class="piece"
            :class="{ 'piece-black': cell === 1, 'piece-white': cell === 2 }"
          ></div>
          <div v-else-if="isValidMove(rowIndex, colIndex)" class="valid-move-indicator"></div>
        </div>
      </div>
    </div>
    <div class="game-info">
      <div class="score">
        <div class="score-black">黒: {{ blackCount }}</div>
        <div class="score-white">白: {{ whiteCount }}</div>
      </div>
      <div class="turn-info">{{ currentTurnText }}</div>
      <div v-if="gameStatus === 'ended'" class="game-result">
        <div class="result-text">{{ gameResultText }}</div>
      </div>
      <button @click="resetGame" class="reset-button">ゲームをリセット</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 盤面の状態を管理
// 0: 空, 1: 黒, 2: 白
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 8x8のオセロ盤を初期化
const board = ref<number[][]>(Array(8).fill(0).map(() => Array(8).fill(EMPTY)));
const currentPlayer = ref<number>(BLACK); // 黒から始める
const gameStatus = ref<'playing' | 'ended'>('playing'); // ゲームの状態を管理

// 初期配置を設定する関数
const initializeBoard = () => {
  // すべてのマスをクリア
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      board.value[i][j] = EMPTY;
    }
  }

  // 初期の4つの石を配置
  board.value[3][3] = WHITE;
  board.value[3][4] = BLACK;
  board.value[4][3] = BLACK;
  board.value[4][4] = WHITE;

  currentPlayer.value = BLACK; // 黒から始める
  gameStatus.value = 'playing'; // ゲーム状態をリセット
};

// ゲームを初期化
onMounted(() => {
  initializeBoard();
});

// 石の数をカウント
const blackCount = computed(() => {
  return board.value.flat().filter(cell => cell === BLACK).length;
});

const whiteCount = computed(() => {
  return board.value.flat().filter(cell => cell === WHITE).length;
});

// 現在のターンを表示するテキスト
const currentTurnText = computed(() => {
  if (gameStatus.value === 'ended') {
    return "ゲーム終了";
  }
  return currentPlayer.value === BLACK ? "黒の番です" : "白の番です";
});

// ゲーム結果を表示するテキスト
const gameResultText = computed(() => {
  if (blackCount.value > whiteCount.value) {
    return "黒の勝ち！";
  } else if (whiteCount.value > blackCount.value) {
    return "白の勝ち！";
  } else {
    return "引き分け";
  }
});

// 指定位置に石を置くことができるかチェック
const canPlaceAt = (row: number, col: number): boolean => {
  // すでに石がある場所には置けない
  if (board.value[row][col] !== EMPTY) {
    return false;
  }

  const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  let canPlace = false;

  // 8方向をチェック
  for (const [dx, dy] of directions) {
    let x = row + dx;
    let y = col + dy;
    let flips = 0;

    // 盤面内で、隣が相手の石である限り進む
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === opponent) {
      x += dx;
      y += dy;
      flips++;
    }

    // 最後に自分の石があれば、その方向はOK
    if (flips > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === currentPlayer.value) {
      canPlace = true;
      break;
    }
  }

  return canPlace;
};

// プレイヤーが石を置ける場所があるかチェック
const hasValidMove = (player: number): boolean => {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board.value[i][j] === EMPTY) {
        // 一時的に currentPlayer を変更してチェック
        const originalPlayer = currentPlayer.value;
        currentPlayer.value = player;
        const canPlace = canPlaceAt(i, j);
        currentPlayer.value = originalPlayer; // 元に戻す
        if (canPlace) {
          return true;
        }
      }
    }
  }
  return false;
};

// プレイヤーが指定された位置に石を置けるかをチェック（ハイライト用）
const isValidMove = (row: number, col: number): boolean => {
  // ゲームが終了している場合はfalse
  if (gameStatus.value === 'ended') {
    return false;
  }

  // すでに石がある場所には置けない
  if (board.value[row][col] !== EMPTY) {
    return false;
  }

  return canPlaceAt(row, col);
};

// 石を置く処理
const makeMove = (row: number, col: number) => {
  // ゲームが終了していたら何もしない
  if (gameStatus.value === 'ended') {
    return;
  }

  if (!canPlaceAt(row, col)) {
    return; // 置けない場所なら何もしない
  }

  const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  // 石を置く
  board.value[row][col] = currentPlayer.value;

  // 各方向について、ひっくり返せる石をチェック
  for (const [dx, dy] of directions) {
    let x = row + dx;
    let y = col + dy;
    const toFlip: [number, number][] = [];

    // 盤面内で、隣が相手の石である限り進む
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === opponent) {
      toFlip.push([x, y]);
      x += dx;
      y += dy;
    }

    // 最後に自分の石があれば、間の石をすべてひっくり返す
    if (toFlip.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === currentPlayer.value) {
      for (const [fx, fy] of toFlip) {
        board.value[fx][fy] = currentPlayer.value;
      }
    }
  }

  // 次のプレイヤーに交代
  currentPlayer.value = opponent;

  // 次のプレイヤーが石を置ける場所があるかチェック
  if (!hasValidMove(currentPlayer.value)) {
    // 次のプレイヤーが置けない場合、元のプレイヤーに戻す
    currentPlayer.value = currentPlayer.value === BLACK ? WHITE : BLACK;

    // さらにこのプレイヤーも置ける場所がなければゲーム終了
    if (!hasValidMove(currentPlayer.value)) {
      // ゲーム終了処理
      gameStatus.value = 'ended';
      console.log("ゲーム終了");
    }
  }
};

// ゲームをリセットする関数
const resetGame = () => {
  initializeBoard();
};
</script>

<style scoped>
.reversi-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px auto;
}

.board-container {
  background-color: var(--board-color);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.board-row {
  display: flex;
}

.board-cell {
  width: 50px;
  height: 50px;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1B5E20;
  cursor: pointer;
}

.piece {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.piece-black {
  background-color: var(--black-piece);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.piece-white {
  background-color: var(--white-piece);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.valid-move {
  position: relative;
  cursor: pointer;
}

.valid-move-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  position: absolute;
}

.game-info {
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 10px;
  font-size: 1.2rem;
  font-weight: bold;
}

.turn-info {
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.game-result {
  margin: 10px 0;
}

.result-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #d32f2f;
}

.reset-button {
  margin-top: 10px;
}
</style>
