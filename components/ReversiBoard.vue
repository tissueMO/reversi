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
          :class="{ 'valid-move': isValidMove(rowIndex, colIndex) && !animationManager.isAnimating.value && !isOpponentTurn }"
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
          <div v-else-if="isValidMove(rowIndex, colIndex) && !animationManager.isAnimating.value && !isOpponentTurn" class="valid-move-indicator" />
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
import { AnimationManager } from '../utils/GameLogic/AnimationManager';
import { CPUController } from '../utils/GameLogic/CPUController';
import type { GameMode } from '../utils/GameLogic/constants';
import { BLACK, WHITE, EMPTY, Position } from '../utils/GameLogic/constants';

/**
 * コンポーネントのプロパティ定義
 */
const props = defineProps<{
  /**
   * ゲームモード設定
   */
  gameMode: GameMode;
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
 * ゲームボードを管理するクラスのインスタンス
 */
const gameLogic = new ReversiGameLogic();

/**
 * アニメーション管理クラスのインスタンス
 */
const animationManager = new AnimationManager();

/**
 * CPUプレイヤーの制御クラスのインスタンス
 */
const cpuController = new CPUController(gameLogic);

/**
 * 盤面の状態への参照（リアクティブ）
 */
const board = ref<number[][]>(gameLogic.getBoard());

/**
 * プレイヤーが操作する石の色
 */
const playerColor = ref<number>(BLACK);

/**
 * 結果モーダルの表示状態
 */
const showResultModal = ref<boolean>(false);

/**
 * クラッカーエフェクトの表示状態
 */
const showConfetti = ref<boolean>(false);

/**
 * ゲームボードのDOM要素への参照
 */
const boardRef = ref<HTMLElement | null>(null);

/**
 * ゲームボードを初期状態に設定
 */
const initializeBoard = (): void => {
  // ゲームロジックを初期化
  gameLogic.initializeBoard();

  // プレイヤーの色をランダムに決定（対戦性の確保）
  playerColor.value = Math.random() < 0.5 ? BLACK : WHITE;

  // 盤面をリアクティブなrefに適用
  board.value = gameLogic.getBoard();

  // アニメーション状態をリセット
  animationManager.reset();

  // 結果表示状態をリセット
  showResultModal.value = false;
  showConfetti.value = false;
};

/**
 * 相手のターンかどうかを判定
 */
const isOpponentTurn = computed(() => {
  return cpuController.isOpponentTurn(playerColor.value, gameLogic.getCurrentPlayer());
});

/**
 * 相手（CPU）の手番処理
 */
const handleOpponentTurn = async () => {
  // CPU対戦モードがオフの場合や、現在がCPUのターンでない場合は何もしない
  if (!cpuController.isPlayerVsCPUMode() ||
      !isOpponentTurn.value ||
      gameLogic.isGameOver() ||
      animationManager.isAnimating.value) {
    return;
  }

  try {
    console.log('CPUが手を考えています...');

    // CPU処理中に明示的にアニメーション状態にして、ユーザー操作を防止
    animationManager.setAnimating(true);

    // CPUの手を決定
    const move = await cpuController.decideCPUMove(gameLogic.getCurrentPlayer());

    // 状態が変化した可能性があるため再チェック
    if (gameLogic.isGameOver() || !isOpponentTurn.value) {
      animationManager.setAnimating(false);
      return;
    }

    console.log('CPUが選んだ手:', move);

    if (move) {
      // CPUの手を実行
      await internalMakeMove(move.row, move.col);
    } else {
      console.log('CPUは有効な手がありません');
      // CPUに有効な手がなかった場合はターン切り替え処理
      handleNoValidMoves();
    }
  } finally {
    // 処理完了後、アニメーション状態を元に戻す
    animationManager.setAnimating(false);
  }
};

/**
 * CPU対CPUの対戦処理
 */
const handleCPUvsCPUTurn = async (): Promise<void> => {
  // CPU対CPUモードがオフの場合や、ゲームが終了している場合は何もしない
  if (!cpuController.isCPUvsCPUMode() ||
      gameLogic.isGameOver() ||
      animationManager.isAnimating.value) {
    return;
  }

  try {
    console.log(`${gameLogic.getCurrentPlayer() === BLACK ? '黒' : '白'}のCPUが手を考えています...`);

    // CPU処理中に明示的にアニメーション状態にして、ユーザー操作を防止
    animationManager.setAnimating(true);

    // CPUの手を決定
    const move = await cpuController.decideCPUMove(gameLogic.getCurrentPlayer());
    console.log(`${gameLogic.getCurrentPlayer() === BLACK ? '黒' : '白'}のCPUが選んだ手:`, move);

    if (move) {
      // CPUの手を実行
      await internalMakeMove(move.row, move.col);

      // 次のCPUの手番を実行（ゲームが終了していなければ）
      if (!gameLogic.isGameOver()) {
        setTimeout(() => handleCPUvsCPUTurn(), 300);
      }
    } else {
      console.log(`${gameLogic.getCurrentPlayer() === BLACK ? '黒' : '白'}のCPUは有効な手がありません`);
      // CPUに有効な手がなかった場合はターン切り替え処理
      handleNoValidMoves();

      // 次のターンがあればCPU対CPUを続行
      if (!gameLogic.isGameOver()) {
        setTimeout(() => handleCPUvsCPUTurn(), 300);
      }
    }
  } finally {
    // 処理完了後、アニメーション状態を元に戻す
    animationManager.setAnimating(false);
  }
};

/**
 * 有効な手がない場合の処理
 */
const handleNoValidMoves = (): void => {
  // 次のターンに進んでゲーム状態を更新
  const canContinue = gameLogic.nextTurn();

  // 盤面状態を反映
  board.value = gameLogic.getBoard();

  // ゲームが終了していれば結果を表示
  if (!canContinue || gameLogic.isGameOver()) {
    showGameResult();
  }
};

/**
 * 石を置く内部処理（CPU用と通常プレイヤー用で共通の処理）
 */
const internalMakeMove = async (row: number, col: number): Promise<void> => {
  // 有効な手でない場合は何もしない
  if (!gameLogic.canPlaceAt(row, col)) {
    return;
  }

  // アニメーション状態に移行
  animationManager.setAnimating(true);

  // 石を置いて反転する石のリストを取得
  const flippablePieces = gameLogic.placeStone(row, col);

  // 盤面状態を更新
  board.value = gameLogic.getBoard();

  // 石の反転アニメーションを実行
  await animationManager.animateFlip({ row, col }, flippablePieces);

  // 次のターンに進んでゲーム状態を更新
  const canContinue = gameLogic.nextTurn();

  // 盤面状態を反映
  board.value = gameLogic.getBoard();

  // ゲームが終了していれば結果を表示
  if (!canContinue || gameLogic.isGameOver()) {
    showGameResult();
    return;
  }

  // アニメーション終了後、次がCPUの手番であれば自動で打つ
  handleOpponentTurn();
};

/**
 * 指定位置に石を置く処理（ユーザーの操作によって呼ばれる）
 */
const makeMove = async (row: number, col: number): Promise<void> => {
  // ゲーム終了時またはアニメーション中は操作無効
  if (gameLogic.isGameOver() || animationManager.isAnimating.value) {
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
 * ゲームを初期状態にリセット
 */
const resetGame = (): void => {
  console.log('ゲームをリセットします。モード:', props.gameMode);
  initializeBoard();
  setupGame();

  // ゲームリセット後の処理
  if (cpuController.isPlayerVsCPUMode()) {
    // プレイヤー対CPUの場合、CPUの手番があれば自動で打つ
    handleOpponentTurn();
  } else if (cpuController.isCPUvsCPUMode()) {
    // CPU対CPUの場合、自動で対戦を開始
    setTimeout(() => {
      handleCPUvsCPUTurn();
    }, 500);
  }
};

/**
 * ゲーム設定を適用
 */
const setupGame = (): void => {
  try {
    console.log('ゲーム設定を初期化します。モード:', props.gameMode);

    // CPUコントローラーの設定を更新
    cpuController.updateSettings(props.gameMode, props.cpuLevel, props.cpu2Level);

  } catch (error) {
    console.error('ゲーム設定の初期化中にエラーが発生しました:', error);
  }
};

/**
 * デバッグ用: ゲーム終了2手前の状態に設定
 */
const skipToEndGame = (): void => {
  // アニメーション中の場合は処理を行わない
  if (animationManager.isAnimating.value) {
    return;
  }

  // アニメーション状態に移行
  animationManager.setAnimating(true);

  // 空きマス数をカウントして、2手前の状態を計算
  const remainingEmptyCells = board.value.flat().filter(cell => cell === EMPTY).length;

  if (remainingEmptyCells <= 2) {
    // 既にゲーム終了2手前以降の場合は何もしない
    animationManager.setAnimating(false);
    return;
  }

  // ゲーム盤面を終盤状態に設定
  gameLogic.generateEndGamePosition(2); // 空きマスを必ず2つにする
  board.value = gameLogic.getBoard();

  // 状態更新後のディレイ
  setTimeout(() => {
    // ゲームが終了していれば結果を表示
    if (!gameLogic.hasValidMove(gameLogic.getCurrentPlayer())) {
      const opponent = gameLogic.getCurrentPlayer() === BLACK ? WHITE : BLACK;

      // 相手も置ける場所がなければゲーム終了
      if (!gameLogic.hasValidMove(opponent)) {
        gameLogic.endGame();
        showGameResult();
      }
    }

    // アニメーション状態を終了
    animationManager.setAnimating(false);
  }, 500);
};

/**
 * デバッグ用: ゲームを強制終了する
 */
const forceGameEnd = (): void => {
  gameLogic.endGame();
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

  gameLogic.setCurrentPlayer(playerNum);
  board.value = gameLogic.getBoard(); // UIを更新
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

    // CPUコントローラーの設定を更新
    cpuController.updateSettings(newGameMode, newCpuLevel, newCpu2Level);

    // 更新後、CPUが手番であれば自動で打つ
    if (cpuController.isPlayerVsCPUMode()) {
      setTimeout(() => {
        handleOpponentTurn();
      }, 500);
    } else if (cpuController.isCPUvsCPUMode()) {
      setTimeout(() => {
        handleCPUvsCPUTurn();
      }, 500);
    }
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
  return gameLogic.getStoneCount(playerColor.value);
});

/**
 * 相手の石の数
 */
const opponentCount = computed((): number => {
  return gameLogic.getStoneCount(playerColor.value === BLACK ? WHITE : BLACK);
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
  switch (cpuController.gameMode) {
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
  switch (cpuController.gameMode) {
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
 * UI表示のための有効な手の判定
 */
const isValidMove = (row: number, col: number): boolean => {
  // ゲーム終了時は全ての手が無効
  if (gameLogic.isGameOver()) {
    return false;
  }

  return gameLogic.canPlaceAt(row, col);
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
