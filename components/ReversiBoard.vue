<template>
  <div ref="boardRef" class="reversi-board fade-in">
    <div class="game-info top-info">
      <div class="score opponent-score" :class="{ 'current-turn': currentPlayer !== playerColor }">
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
          :class="{ 'valid-move': isValidMove(rowIndex, colIndex) && !isAnimating && !isOpponentTurn }"
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
          <div v-else-if="isValidMove(rowIndex, colIndex) && !isAnimating && !isOpponentTurn" class="valid-move-indicator" />
        </div>
      </div>
    </div>
    <div class="game-info bottom-info">
      <div class="score player-score" :class="{ 'current-turn': currentPlayer === playerColor }">
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
import { CPUPlayer, CPULevel } from '../utils/CPUPlayer';

/**
 * コンポーネントのプロパティ定義
 */
const props = defineProps<{
  /**
   * ゲームモード設定
   */
  gameMode: 'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu';
  /**
   * CPU強さ設定（プレイヤー対CPU、またはCPU対CPUの1P側の強さ）
   */
  cpuLevel: CPULevel;
  /**
   * CPU2強さ設定（CPU対CPUの2P側の強さ）
   */
  cpu2Level: CPULevel;
}>();

/**
 * emitするイベントの定義
 */
const emit = defineEmits<{
  /**
   * リセットボタンが押されたとき、または次のゲームへボタンが押されたときに発行されるイベント
   * 親コンポーネントで設定モーダルを表示するために使用
   */
  (e: 'reset-request' | 'next-game-request'): void;
}>();

/**
 * ゲームの基本定数
 */
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

/**
 * デバイスがモバイルかどうかを判定
 */
const isMobileDevice = ref<boolean>(false);

/**
 * デバイスタイプの検出
 */
const detectDeviceType = (): void => {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent || navigator.vendor;
    isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }
};

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
 * 結果モーダルの表示状態
 */
const showResultModal = ref<boolean>(false);

/**
 * クラッカーエフェクトの表示状態
 */
const showConfetti = ref<boolean>(false);

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
  showResultModal.value = false;
  showConfetti.value = false;
};

/**
 * ゲームボードのDOM要素への参照
 */
const boardRef = ref<HTMLElement | null>(null);

/**
 * ゲーム終了2手前の状態に設定
 */
const skipToEndGame = (): void => {
  // アニメーション中の場合は処理を行わない
  if (isAnimating.value) {
    return;
  }

  // アニメーション状態に移行
  isAnimating.value = true;

  // 空きマス数をカウントして、2手前の状態を計算
  const remainingEmptyCells = board.value.flat().filter(cell => cell === EMPTY).length;

  if (remainingEmptyCells <= 2) {
    // 既にゲーム終了2手前以降の場合は何もしない
    isAnimating.value = false;
    return;
  }

  // ゲーム盤面を終盤状態に設定
  generateEndGamePosition(2); // 空きマスを必ず2つにする

  // 状態更新後のディレイ
  setTimeout(() => {
    // ターン処理とゲーム終了判定
    if (!hasValidMove(currentPlayer.value)) {
      // 次のプレイヤーに有効な手がなければ、相手プレイヤーに戻す
      currentPlayer.value = currentPlayer.value === BLACK ? WHITE : BLACK;

      // さらに有効な手がなければゲーム終了
      if (!hasValidMove(currentPlayer.value)) {
        gameStatus.value = 'ended';
        showGameResult();
      }
    }

    // アニメーション状態を終了
    isAnimating.value = false;
  }, 500);
};

/**
 * 終盤の盤面状態を生成する
 * @param emptyCount 残す空きマスの数
 */
const generateEndGamePosition = (emptyCount: number): void => {
  // 盤面をほぼ埋め尽くした状態にする
  const totalCells = 64; // 8x8の盤面
  const blackCount = Math.floor((totalCells - emptyCount) / 2);
  const whiteCount = totalCells - emptyCount - blackCount;

  // 一度盤面をクリア
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      board.value[i][j] = EMPTY;
    }
  }

  // まずemptyCountの数だけ空きマスの位置を決める
  const emptyCells: [number, number][] = [];
  while (emptyCells.length < emptyCount) {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 8);
    // 既に選ばれていない位置を追加
    if (!emptyCells.some(([r, c]) => r === row && c === col)) {
      emptyCells.push([row, col]);
    }
  }

  // 残りのマスに黒石と白石を配置
  let remainingBlack = blackCount;
  let remainingWhite = whiteCount;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // 空きマスに指定された位置はスキップ
      if (emptyCells.some(([r, c]) => r === i && c === j)) {
        continue;
      }

      // すべての石を配置し終えたら終了
      if (remainingBlack === 0 && remainingWhite === 0) {
        break;
      }

      // ランダムに石を配置
      const rand = Math.random();

      if (rand < 0.5 && remainingBlack > 0) {
        board.value[i][j] = BLACK;
        remainingBlack--;
      } else if (remainingWhite > 0) {
        board.value[i][j] = WHITE;
        remainingWhite--;
      } else if (remainingBlack > 0) {
        board.value[i][j] = BLACK;
        remainingBlack--;
      }
    }
  }

  // 有効な手があるプレイヤーを探して手番を設定
  if (hasValidMove(BLACK)) {
    currentPlayer.value = BLACK;
  } else if (hasValidMove(WHITE)) {
    currentPlayer.value = WHITE;
  } else {
    // 両プレイヤーとも置けない場合はゲーム終了
    gameStatus.value = 'ended';
    showGameResult();
  }
};

/**
 * CPUプレイヤーのインスタンス
 */
const cpuPlayer = ref<CPUPlayer | null>(null);

/**
 * CPU対CPU用の第2 CPUプレイヤーのインスタンス
 */
const cpu2Player = ref<CPUPlayer | null>(null);

/**
 * ゲーム設定
 */
const gameSettings = ref({
  gameMode: 'twoPlayers' as 'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu',
  cpuLevel: CPULevel.MEDIUM,
  cpu2Level: CPULevel.MEDIUM,
});

/**
 * 相手のターンかどうかを判定
 * CPUモードが有効な場合の判定を行う
 */
const isOpponentTurn = computed(() => {
  // CPU対CPUモードの場合、常にCPUがプレイするのでユーザー操作は不要
  if (gameSettings.value.gameMode === 'cpuVsCpu') {
    return true;
  }

  // プレイヤー対CPUモードの場合、プレイヤーの色ではない方がCPUの色
  if (gameSettings.value.gameMode === 'playerVsCPU') {
    const opponentColor = playerColor.value === BLACK ? WHITE : BLACK;
    return currentPlayer.value === opponentColor;
  }

  return false;
});

/**
 * 設定が更新されたときの処理
 */
const updateSettings = (settings: { gameMode: 'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu'; cpuLevel: CPULevel; cpu2Level: CPULevel }) => {
  gameSettings.value = settings;

  // CPUプレイヤーの設定
  if (settings.gameMode === 'playerVsCPU') {
    cpuPlayer.value = new CPUPlayer(settings.cpuLevel);
    cpu2Player.value = null;

    // CPUが「相手」として設定されたら、そのターンであれば手を打つ
    // アニメーションが終了後に実行するため少し遅延させる
    setTimeout(() => {
      handleOpponentTurn();
    }, 500);
  }
  // CPU対CPUモードの設定
  else if (settings.gameMode === 'cpuVsCpu') {
    cpuPlayer.value = new CPUPlayer(settings.cpuLevel);
    cpu2Player.value = new CPUPlayer(settings.cpu2Level);

    // CPU対CPUの場合は、自動的に対戦を開始する
    setTimeout(() => {
      handleCPUvsCPUTurn();
    }, 500);
  }
  // 2人プレイモードの場合はCPUプレイヤーをクリア
  else {
    cpuPlayer.value = null;
    cpu2Player.value = null;
  }
};

/**
 * 相手（CPU）の手番処理
 */
const handleOpponentTurn = async () => {
  // CPU対戦モードがオフの場合は何もしない
  if (gameSettings.value.gameMode !== 'playerVsCPU' || !cpuPlayer.value) {
    return;
  }

  const opponentColor = playerColor.value === BLACK ? WHITE : BLACK;

  // 現在が相手のターンであり、ゲームがプレイ中の場合のみ動作
  if (currentPlayer.value === opponentColor && gameStatus.value === 'playing') {
    // アニメーション中は何もしない
    if (isAnimating.value) {
      // アニメーション終了後に再試行するためのタイマーを設定
      setTimeout(() => handleOpponentTurn(), 500);
      return;
    }

    console.log('CPUが手を考えています...');

    // CPU思考時間を設定（1秒）
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 状態が変化した可能性があるため再チェック
    if (gameStatus.value !== 'playing' ||
        currentPlayer.value !== opponentColor ||
        isAnimating.value) {
      return;
    }

    // CPUの手を決定
    const move = cpuPlayer.value.selectMove(board.value, currentPlayer.value);
    console.log('CPUが選んだ手:', move);

    if (move) {
      // CPU処理中に明示的にアニメーション状態にして、ユーザー操作を防止
      isAnimating.value = true;

      // CPUの手を実行
      await internalMakeMove(move.row, move.col);

      // アニメーション状態を元に戻す（本来はmakeMoveの中で処理されるが念のため）
      setTimeout(() => {
        isAnimating.value = false;
      }, 100);
    } else {
      console.log('CPUは有効な手がありません');
      // CPUに有効な手がなかった場合のスキップ処理
      const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;
      currentPlayer.value = opponent;

      // さらに次のプレイヤーも置ける場所がなければゲーム終了
      if (!hasValidMove(currentPlayer.value)) {
        gameStatus.value = 'ended';
        showGameResult();
      }
    }
  }
};

/**
 * CPU対CPUの対戦処理
 * 両方のCPUプレイヤーが自動的に対戦するための処理
 */
const handleCPUvsCPUTurn = async (): Promise<void> => {
  // CPU対CPUモードがオフの場合は何もしない
  if (gameSettings.value.gameMode !== 'cpuVsCpu' || !cpuPlayer.value || !cpu2Player.value) {
    return;
  }

  // ゲームがプレイ中の場合のみ動作
  if (gameStatus.value === 'playing') {
    // アニメーション中は何もしない
    if (isAnimating.value) {
      // アニメーション終了後に再試行するためのタイマーを設定
      setTimeout(() => handleCPUvsCPUTurn(), 500);
      return;
    }

    console.log(`${currentPlayer.value === BLACK ? '黒' : '白'}のCPUが手を考えています...`);

    // CPU思考時間を設定（0.8秒）
    await new Promise(resolve => setTimeout(resolve, 800));

    // 状態が変化した可能性があるため再チェック
    if (gameStatus.value !== 'playing' || isAnimating.value) {
      return;
    }

    // 現在のプレイヤーに合わせたCPUインスタンスを選択
    const activeCPU = currentPlayer.value === BLACK ? cpuPlayer.value : cpu2Player.value;

    // CPUの手を決定
    const move = activeCPU.selectMove(board.value, currentPlayer.value);
    console.log(`${currentPlayer.value === BLACK ? '黒' : '白'}のCPUが選んだ手:`, move);

    if (move) {
      // CPU処理中に明示的にアニメーション状態にして、ユーザー操作を防止
      isAnimating.value = true;

      // CPUの手を実行
      await internalMakeMove(move.row, move.col);

      // アニメーション状態を元に戻す
      setTimeout(() => {
        isAnimating.value = false;

        // 次のCPUの手番を実行
        if (gameStatus.value === 'playing') {
          setTimeout(() => {
            handleCPUvsCPUTurn();
          }, 300);
        }
      }, 100);
    } else {
      console.log(`${currentPlayer.value === BLACK ? '黒' : '白'}のCPUは有効な手がありません`);
      // CPUに有効な手がなかった場合のスキップ処理
      const opponent = currentPlayer.value === BLACK ? WHITE : BLACK;
      currentPlayer.value = opponent;

      // さらに次のプレイヤーも置ける場所がなければゲーム終了
      if (!hasValidMove(currentPlayer.value)) {
        gameStatus.value = 'ended';
        showGameResult();
      } else {
        // 次のCPUの手番を実行
        setTimeout(() => {
          handleCPUvsCPUTurn();
        }, 300);
      }
    }
  }
};

/**
 * 石を置く内部処理（CPU用と通常プレイヤー用で共通の処理）
 */
const internalMakeMove = async (row: number, col: number): Promise<void> => {
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

  return new Promise<void>((resolve) => {
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
          showGameResult();
        }
      }

      // アニメーション状態を終了
      isAnimating.value = false;

      // アニメーション終了後、次がCPUの手番であれば自動で打つ
      handleOpponentTurn();

      // Promiseを解決
      resolve();
    }, totalDelay);
  });
};

/**
 * 指定位置に石を置く処理（ユーザーの操作によって呼ばれる）
 */
const makeMove = async (row: number, col: number): Promise<void> => {
  // ゲーム終了時またはアニメーション中は操作無効
  if (gameStatus.value === 'ended' || isAnimating.value) {
    return;
  }

  // CPUの番でユーザーがクリックした場合は無視
  if (isOpponentTurn.value) {
    return;
  }

  await internalMakeMove(row, col);
};

/**
 * ゲーム終了時の結果表示処理
 */
const showGameResult = (): void => {
  // 少し遅延を設ける
  setTimeout(() => {
    showResultModal.value = true;

    // プレイヤーが勝った場合はクラッカーエフェクトを表示
    if (isPlayerWin.value) {
      showConfetti.value = true;
      // クラッカーエフェクトを3秒後に非表示にする
      setTimeout(() => {
        showConfetti.value = false;
      }, 3000);
    }
  }, 500);
};

/**
 * 結果モーダルを閉じる処理
 */
const closeResultModal = (): void => {
  showResultModal.value = false;
};

/**
 * 親コンポーネントから直接渡されたpropsを更新
 */
const setupGame = (): void => {
  try {
    console.log('ゲーム設定を初期化します。モード:', props.gameMode);

    // CPUプレイヤーの設定
    if (props.gameMode === 'playerVsCPU') {
      cpuPlayer.value = new CPUPlayer(props.cpuLevel);
      cpu2Player.value = null;
    }
    // CPU対CPUモードの設定
    else if (props.gameMode === 'cpuVsCpu') {
      cpuPlayer.value = new CPUPlayer(props.cpuLevel);
      cpu2Player.value = new CPUPlayer(props.cpu2Level);
    }
    // 2人プレイモードの場合はCPUプレイヤーを無効化
    else {
      cpuPlayer.value = null;
      cpu2Player.value = null;
    }
  } catch (error) {
    console.error('ゲーム設定の初期化中にエラーが発生しました:', error);
  }
};

/**
 * ゲームを初期状態にリセット
 */
const resetGame = (): void => {
  console.log('ゲームをリセットします。モード:', props.gameMode);
  initializeBoard();
  setupGame();

  // ゲームリセット後の処理
  if (props.gameMode === 'playerVsCPU') {
    // プレイヤー対CPUの場合、CPUの手番があれば自動で打つ
    handleOpponentTurn();
  } else if (props.gameMode === 'cpuVsCpu') {
    // CPU対CPUの場合、自動で対戦を開始
    setTimeout(() => {
      handleCPUvsCPUTurn();
    }, 500);
  }
};

/**
 * デバッグ用: ゲームを強制終了する
 */
const forceGameEnd = (): void => {
  gameStatus.value = 'ended';
  showGameResult();
  console.info('ゲームを強制終了しました。');
};

/**
 * デバッグ用: 手番プレイヤーを設定
 */
const setPlayer = (playerNum: number): void => {
  if (playerNum !== BLACK && playerNum !== WHITE) {
    console.error('無効なプレイヤー値です。1(黒)または2(白)を指定してください。');
    return;
  }

  currentPlayer.value = playerNum;
  console.info(`手番プレイヤーを${playerNum === BLACK ? '黒' : '白'}に設定しました。`);
};

// 外部からアクセス可能なメソッドを公開
defineExpose({
  resetGame,
});

/**
 * 親コンポーネントからの設定変更を監視
 */
watch([() => props.gameMode, () => props.cpuLevel, () => props.cpu2Level],
  ([newGameMode, newCpuLevel, newCpu2Level]) => {
    console.log('親コンポーネントから設定が変更されました:', newGameMode, newCpuLevel, newCpu2Level);

    // 現在の設定を更新
    gameSettings.value = {
      gameMode: newGameMode,
      cpuLevel: newCpuLevel,
      cpu2Level: newCpu2Level,
    };

    // 更新された設定を適用
    updateSettings(gameSettings.value);
  },
  { immediate: true }, // コンポーネントのマウント時に即座に実行
);

/**
 * コンポーネントのマウント時の初期化処理
 */
onMounted(() => {
  initializeBoard();
  detectDeviceType();

  // ウィンドウサイズが変更された場合にデバイスタイプを再検出
  window.addEventListener('resize', detectDeviceType);

  // デバッグ用のグローバル関数を登録
  if (typeof window !== 'undefined') {
    // @ts-ignore - 実行時にwindowオブジェクトに動的にプロパティを追加
    window.__reversiDebug = {
      skipToEndGame,
      forceGameEnd,
      setPlayer,
    };
    console.info(
      'リバーシデバッグ機能が利用可能です。以下のコマンドをコンソールで実行できます：\n' +
      '・window.__reversiDebug.skipToEndGame() - ゲーム終了2手前までショートカット\n' +
      '・window.__reversiDebug.forceGameEnd() - ゲームを強制終了\n' +
      '・window.__reversiDebug.setPlayer(playerNum) - 手番プレイヤーを設定 (1:黒, 2:白)',
    );
  }
});

/**
 * コンポーネントのアンマウント時のクリーンアップ処理
 */
onUnmounted(() => {
  // イベントリスナーを削除
  window.removeEventListener('resize', detectDeviceType);

  // デバッグ用のグローバル関数を削除
  if (typeof window !== 'undefined') {
    // @ts-ignore - 実行時にwindowオブジェクトからプロパティを削除
    delete window.__reversiDebug;
  }
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
 * プレイヤーが勝ったかどうか
 */
const isPlayerWin = computed((): boolean => {
  return playerCount.value > opponentCount.value;
});

/**
 * ゲーム結果のテキスト
 */
const gameResultText = computed((): string => {
  if (isPlayerWin.value) {
    return 'あなたの勝ち！';
  } else if (opponentCount.value > playerCount.value) {
    return '相手の勝ち！';
  } else {
    return '引き分け';
  }
});

/**
 * プレイヤー1の表示名（対戦モードによって異なる）
 */
const playerDisplayName = computed((): string => {
  switch (gameSettings.value.gameMode) {
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
 * プレイヤー2（相手）の表示名（対戦モードによって異なる）
 */
const opponentDisplayName = computed((): string => {
  switch (gameSettings.value.gameMode) {
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
 * リセットボタンが押されたときの処理
 * 設定モーダルを表示するリクエストを親コンポーネントに送信
 */
const handleResetRequest = (): void => {
  emit('reset-request');
};

/**
 * 次のゲームへボタンが押されたときの処理
 * 親コンポーネントで設定モーダルを表示するためのイベントを発行
 */
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
  max-width: 600px; /* スコア表示の最大幅を設定 */
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

/* 相手のスコア表示を180度回転させる（モバイル時のみ） */
.rotated {
  transform: rotate(180deg);
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
