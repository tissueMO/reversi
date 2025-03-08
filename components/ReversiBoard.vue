<template>
  <div class="reversi-board">
    <div class="game-info top-info">
      <div class="score opponent-score" :class="{ 'current-turn': currentPlayer !== playerColor }">
        <div class="score-content">
          <div class="score-icon-and-count">
            <div class="color-icon" :class="opponentColorClass"></div>
            <div class="score-text">相手: <span class="count-display">{{ opponentCount }}</span></div>
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
          :class="{ 'valid-move': isValidMove(rowIndex, colIndex) && !isAnimating }"
          @click="makeMove(rowIndex, colIndex)"
        >
          <div
            v-if="cell !== 0"
            class="piece"
            :class="{
              'piece-black': cell === 1,
              'piece-white': cell === 2,
              'flipping': isFlipping(rowIndex, colIndex)
            }"
          ></div>
          <div v-else-if="isValidMove(rowIndex, colIndex) && !isAnimating" class="valid-move-indicator"></div>
        </div>
      </div>
    </div>

    <div class="game-info bottom-info">
      <div class="score player-score" :class="{ 'current-turn': currentPlayer === playerColor }">
        <div class="score-content">
          <div class="score-icon-and-count">
            <div class="color-icon" :class="playerColorClass"></div>
            <div class="score-text">自分: <span class="count-display">{{ playerCount }}</span></div>
          </div>
        </div>
      </div>

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

// 8x8のリバーシ盤を初期化
const board = ref<number[][]>(Array(8).fill(0).map(() => Array(8).fill(EMPTY)));
const currentPlayer = ref<number>(BLACK); // 黒から始める
const gameStatus = ref<'playing' | 'ended'>('playing'); // ゲームの状態を管理
const playerColor = ref<number>(BLACK); // プレイヤーの色（ランダムに決定）

// ひっくり返しアニメーション用の状態管理
const flippingPieces = ref<Set<string>>(new Set());
// アニメーション中かどうかを示す状態
const isAnimating = ref<boolean>(false);

// 指定された位置の駒がひっくり返し中かどうかをチェック
const isFlipping = (row: number, col: number): boolean => {
  return flippingPieces.value.has(`${row}-${col}`);
};

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

  // ランダムに先手（黒）か後手（白）かを決定
  playerColor.value = Math.random() < 0.5 ? BLACK : WHITE;
  currentPlayer.value = BLACK; // 黒から始める
  gameStatus.value = 'playing'; // ゲーム状態をリセット
  flippingPieces.value.clear(); // ひっくり返し状態をクリア
  isAnimating.value = false; // アニメーション状態をリセット
};

// ゲームを初期化
onMounted(() => {
  initializeBoard();
});

// プレイヤーとオポーネントの色テキスト
const playerColorText = computed(() => {
  return playerColor.value === BLACK ? "黒" : "白";
});

const opponentColorText = computed(() => {
  return playerColor.value === BLACK ? "白" : "黒";
});

// プレイヤーとオポーネントの色クラス
const playerColorClass = computed(() => {
  return playerColor.value === BLACK ? "black-icon" : "white-icon";
});

const opponentColorClass = computed(() => {
  return playerColor.value === BLACK ? "white-icon" : "black-icon";
});

// プレイヤーとオポーネントの石の数をカウント
const playerCount = computed(() => {
  return board.value.flat().filter(cell => cell === playerColor.value).length;
});

const opponentCount = computed(() => {
  return board.value.flat().filter(cell => cell !== EMPTY && cell !== playerColor.value).length;
});

// 現在のターンを表示するテキスト
const currentTurnText = computed(() => {
  if (gameStatus.value === 'ended') {
    return "ゲーム終了";
  }

  if (currentPlayer.value === playerColor.value) {
    return "あなたの番です";
  } else {
    return "相手の番です";
  }
});

// ゲーム結果を表示するテキスト
const gameResultText = computed(() => {
  if (playerCount.value > opponentCount.value) {
    return "あなたの勝ち！";
  } else if (opponentCount.value > playerCount.value) {
    return "相手の勝ち！";
  } else {
    return "引き分け";
  }
});

// 以下は既存の関数
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

  // アニメーション中は操作を受け付けない
  if (isAnimating.value) {
    return;
  }

  if (!canPlaceAt(row, col)) {
    return; // 置けない場所なら何もしない
  }

  // アニメーション開始状態に設定
  isAnimating.value = true;

  const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  // 石を置く
  board.value[row][col] = currentPlayer.value;

  // 全ての反転対象となるマスを収集
  const allFlips: Array<{position: [number, number], distance: number}> = [];

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

    // 最後に自分の石があれば、間の石をすべてリストに追加
    if (toFlip.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === currentPlayer.value) {
      for (const pos of toFlip) {
        // ユークリッド距離を計算（置いた場所からの直線距離）
        const dx = pos[0] - row;
        const dy = pos[1] - col;
        const distance = Math.sqrt(dx * dx + dy * dy); // ユークリッド距離
        allFlips.push({ position: pos, distance });
      }
    }
  }

  // 距離でソート（近い順）
  allFlips.sort((a, b) => a.distance - b.distance);

  // 距離に応じて時間差でアニメーションを実行
  let maxDelay = 0;
  allFlips.forEach((flip) => {
    const [fx, fy] = flip.position;
    const key = `${fx}-${fy}`;

    // 距離に応じて遅延時間を計算（同心円状に広がるように）
    // 距離の整数部分 * 40ms の遅延を適用（60msから40msに短縮）
    const delay = Math.floor(flip.distance * 40);
    maxDelay = Math.max(maxDelay, delay);

    // 遅延後にフリップアニメーション開始
    setTimeout(() => {
      flippingPieces.value.add(key);

      // アニメーションが終わってから色を変更
      setTimeout(() => {
        board.value[fx][fy] = currentPlayer.value;

        // アニメーション終了後にflippingPiecesから削除
        setTimeout(() => {
          flippingPieces.value.delete(key);
        }, 30); // 50msから30msに短縮
      }, 300); // 450msから300msに短縮（アニメーションの半分の時間後に色を変更）
    }, delay);
  });

  // 次のプレイヤーに交代（全てのアニメーションが終わった後に実行するため遅延）
  // 最大遅延時間 + アニメーション時間 + 待機時間
  const animationDelay = maxDelay + 350; // 500msから350msに短縮
  const pauseAfterAnimation = 300; // 500msから300msに短縮
  const totalDelay = animationDelay + pauseAfterAnimation;

  setTimeout(() => {
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

    // アニメーション終了状態に設定
    isAnimating.value = false;
  }, totalDelay); // アニメーション完了＋待機時間後に次のターンに移る
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
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.board-container {
  background-color: var(--board-color);
  padding: 8px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  /* サイズ計算を改善 - 正方形を保証し、はみ出しを防止、最大サイズを600x600に制限 */
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
  aspect-ratio: 1; /* 縦横比を1:1に保つ */
  flex: 1;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1B5E20;
  cursor: pointer;
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

/* ひっくり返しアニメーション */
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
  margin: 10px 0;
  max-width: 600px; /* スコア表示の最大幅を設定 */
}

.top-info {
  margin-bottom: 10px;
}

.bottom-info {
  margin-top: 10px;
}

.score {
  width: 100%;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
  padding: 5px 15px;
  border-radius: 4px;
  box-sizing: border-box;
  max-width: 200px; /* スコア表示幅をさらに縮小 */
  transition: background-color 0.6s ease, box-shadow 0.6s ease; /* フェード効果を追加 */
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

.score-text {
  white-space: nowrap;
}

.count-display {
  display: inline-block;
  min-width: 24px; /* 3桁まで入る幅 */
  text-align: right;
}

.current-turn {
  background-color: rgba(76, 175, 80, 0.3); /* ハイライトをより強調 */
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); /* 少し目立つ効果を追加 */
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
