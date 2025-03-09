<template>
  <div class="reversi-board">
    <div class="game-info top-info">
      <div class="score opponent-score" :class="{ 'current-turn': currentPlayer !== playerColor }">
        <div class="score-content">
          <div class="score-icon-and-count">
            <div class="color-icon" :class="opponentColorClass" />
            <div class="score-text">
              相手: <span class="count-display">{{ opponentCount }}</span>
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
          />
          <div v-else-if="isValidMove(rowIndex, colIndex) && !isAnimating" class="valid-move-indicator" />
        </div>
      </div>
    </div>
    <div class="game-info bottom-info">
      <div class="score player-score" :class="{ 'current-turn': currentPlayer === playerColor }">
        <div class="score-content">
          <div class="score-icon-and-count">
            <div class="color-icon" :class="playerColorClass" />
            <div class="score-text">
              自分: <span class="count-display">{{ playerCount }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="gameStatus === 'ended'" class="game-result">
        <div class="result-text">
          {{ gameResultText }}
        </div>
      </div>
      <button class="reset-button" @click="resetGame">
        ゲームをリセット
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

/**
 * ゲームの基本定数
 */
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

/**
 * ゲームの状態を表す型
 */
type GameStatus = 'playing' | 'ended';

/**
 * 盤面の状態を管理するデータ構造
 * 0: 空, 1: 黒, 2: 白
 */
const board = ref<number[][]>(Array(8).fill(0).map(() => Array(8).fill(EMPTY)));

/**
 * 現在の手番プレイヤーを保持
 */
const currentPlayer = ref<number>(BLACK);

/**
 * ゲームの進行状態を管理
 */
const gameStatus = ref<GameStatus>('playing');

/**
 * プレイヤーが操作する石の色
 */
const playerColor = ref<number>(BLACK);

/**
 * アニメーション中の駒を管理するためのセット
 */
const flippingPieces = ref<Set<string>>(new Set());

/**
 * アニメーション実行中かどうかのフラグ
 */
const isAnimating = ref<boolean>(false);

/**
 * 指定位置の駒がアニメーション中かを判定
 */
const isFlipping = (row: number, col: number): boolean => {
  return flippingPieces.value.has(`${row}-${col}`);
};

/**
 * ゲームボードを初期状態に設定
 */
const initializeBoard = (): void => {
  // 全マスをクリア
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      board.value[i][j] = EMPTY;
    }
  }

  // リバーシの初期配置（中央に黒白が交互に配置される）
  board.value[3][3] = WHITE;
  board.value[3][4] = BLACK;
  board.value[4][3] = BLACK;
  board.value[4][4] = WHITE;

  // プレイヤーの色をランダムに決定（対戦性の確保）
  playerColor.value = Math.random() < 0.5 ? BLACK : WHITE;

  // ゲーム開始時は常に黒から
  currentPlayer.value = BLACK;

  // ゲーム状態の初期化
  gameStatus.value = 'playing';
  flippingPieces.value.clear();
  isAnimating.value = false;
};

/**
 * コンポーネントマウント時の初期化処理
 */
onMounted(() => {
  initializeBoard();
});

/**
 * プレイヤー色に対応するCSSクラス
 */
const playerColorClass = computed((): string => {
  return playerColor.value === BLACK ? 'black-icon' : 'white-icon';
});

/**
 * 相手色に対応するCSSクラス
 */
const opponentColorClass = computed((): string => {
  return playerColor.value === BLACK ? 'white-icon' : 'black-icon';
});

/**
 * プレイヤーの石の数
 */
const playerCount = computed((): number => {
  return board.value.flat().filter(cell => cell === playerColor.value).length;
});

/**
 * 相手の石の数
 */
const opponentCount = computed((): number => {
  return board.value.flat().filter(cell => cell !== EMPTY && cell !== playerColor.value).length;
});

/**
 * ゲーム結果のテキスト
 */
const gameResultText = computed((): string => {
  if (playerCount.value > opponentCount.value) {
    return 'あなたの勝ち！';
  } else if (opponentCount.value > playerCount.value) {
    return '相手の勝ち！';
  } else {
    return '引き分け';
  }
});

/**
 * 指定位置に石を置けるかの判定
 */
const canPlaceAt = (row: number, col: number): boolean => {
  // すでに石があるマスには置けない
  if (board.value[row][col] !== EMPTY) {
    return false;
  }

  const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;

  // 8方向のベクトル定義
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  let canPlace = false;

  // 各方向について、挟める石があるかを確認
  for (const [dx, dy] of directions) {
    let x = row + dx;
    let y = col + dy;
    let flips = 0;

    // 盤面内かつ相手の石が続く限り進む
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === opponent) {
      x += dx;
      y += dy;
      flips++;
    }

    // 1つ以上の石を挟み、最後に自分の石があれば有効な手
    if (flips > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === currentPlayer.value) {
      canPlace = true;
      break;
    }
  }

  return canPlace;
};

/**
 * 指定プレイヤーが有効な手を持っているかを判定
 */
const hasValidMove = (player: number): boolean => {
  // 一時的に手番を変更して全マスをチェック
  const originalPlayer = currentPlayer.value;
  currentPlayer.value = player;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board.value[i][j] === EMPTY && canPlaceAt(i, j)) {
        // 元の手番に戻して有効な手があることを返す
        currentPlayer.value = originalPlayer;
        return true;
      }
    }
  }

  // 元の手番に戻して有効な手がないことを返す
  currentPlayer.value = originalPlayer;
  return false;
};

/**
 * UI表示のための有効な手の判定
 */
const isValidMove = (row: number, col: number): boolean => {
  // ゲーム終了時は全ての手が無効
  if (gameStatus.value === 'ended') {
    return false;
  }

  // すでに石があるマスは無効
  if (board.value[row][col] !== EMPTY) {
    return false;
  }

  return canPlaceAt(row, col);
};

/**
 * 指定位置に石を置く処理
 */
const makeMove = (row: number, col: number): void => {
  // ゲーム終了時またはアニメーション中は操作無効
  if (gameStatus.value === 'ended' || isAnimating.value) {
    return;
  }

  // 有効な手でない場合は無視
  if (!canPlaceAt(row, col)) {
    return;
  }

  // アニメーション状態に移行
  isAnimating.value = true;

  const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;

  // 8方向のベクトル定義
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  // 石を置いた位置を更新
  board.value[row][col] = currentPlayer.value;

  // 反転対象となる石の情報を収集
  const allFlips: Array<{position: [number, number], distance: number}> = [];

  // 各方向について反転すべき石を特定
  for (const [dx, dy] of directions) {
    let x = row + dx;
    let y = col + dy;
    const toFlip: [number, number][] = [];

    // 相手の石が続く限り進む
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === opponent) {
      toFlip.push([x, y]);
      x += dx;
      y += dy;
    }

    // 最後に自分の石があれば、間の石を全て反転対象に
    if (toFlip.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board.value[x][y] === currentPlayer.value) {
      for (const pos of toFlip) {
        // 置いた位置からの距離を計算（アニメーション順序用）
        const dx = pos[0] - row;
        const dy = pos[1] - col;
        const distance = Math.sqrt(dx * dx + dy * dy);
        allFlips.push({ position: pos, distance });
      }
    }
  }

  // 距離の近い順に並べ替え
  allFlips.sort((a, b) => a.distance - b.distance);

  // 同心円状に広がるアニメーションの実行
  let maxDelay = 0;
  allFlips.forEach((flip) => {
    const [fx, fy] = flip.position;
    const key = `${fx}-${fy}`;
    // 距離に応じた遅延でアニメーション
    const delay = Math.floor(flip.distance * 40);
    maxDelay = Math.max(maxDelay, delay);

    // アニメーション開始
    setTimeout(() => {
      flippingPieces.value.add(key);

      // アニメーション途中で色変更
      setTimeout(() => {
        board.value[fx][fy] = currentPlayer.value;

        // アニメーション終了時に状態を更新
        setTimeout(() => {
          flippingPieces.value.delete(key);
        }, 30);
      }, 300);
    }, delay);
  });

  // 全てのアニメーション完了後に次のターンへ
  const animationDelay = maxDelay + 350;
  const pauseAfterAnimation = 300;
  const totalDelay = animationDelay + pauseAfterAnimation;

  setTimeout(() => {
    // 手番を切り替え
    currentPlayer.value = opponent;

    // ターン処理とゲーム終了判定
    if (!hasValidMove(currentPlayer.value)) {
      // 次のプレイヤーに有効な手がなければ、元のプレイヤーに戻す
      currentPlayer.value = currentPlayer.value === BLACK ? WHITE : BLACK;

      // さらに元のプレイヤーも置ける場所がなければゲーム終了
      if (!hasValidMove(currentPlayer.value)) {
        gameStatus.value = 'ended';
      }
    }

    // アニメーション状態を終了
    isAnimating.value = false;
  }, totalDelay);
};

/**
 * ゲームを初期状態にリセット
 */
const resetGame = (): void => {
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
  cursor: default; /* デフォルトのカーソルをポインターから通常カーソルに変更 */
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
  cursor: pointer; /* 有効なマスだけポインターカーソルを維持 */
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
