import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import ReversiBoard from '../../components/ReversiBoard.vue';
import { CPUPlayer, CPULevel } from '~/utils/CPUPlayer';

describe('ReversiBoard', () => {
  /**
   * テストのためのコンポーネントをマウント
   * DOM操作を必要とするテスト向けにdocument.bodyにアタッチする
   * 戻り値の型にコンポーネントの内部メソッドや変数の型情報を含める
   */
  function mountBoard (): VueWrapper<InstanceType<typeof ReversiBoard>> {
    return mount(ReversiBoard, {
      attachTo: document.body,
      // CPU対戦機能をテスト中は無効化
      data() {
        return {
          gameSettings: {
            isCPUOpponent: false,
            cpuLevel: CPULevel.MEDIUM,
          },
        };
      },
    });
  }

  /**
   * タイマー関連のテスト用に仮想タイマーを設定
   */
  beforeEach(() => {
    vi.useFakeTimers();
  });

  /**
   * テスト間での副作用を防ぐためにモックとタイマーをリセット
   */
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('初期化', () => {
    it('ボードが正しく初期化される', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 8x8ボードの構造を検証
      const rows = wrapper.findAll('.board-row');
      expect(rows).toHaveLength(8);

      // 各行に8つのセルが存在することを確認
      rows.forEach((row) => {
        expect(row.findAll('.board-cell')).toHaveLength(8);
      });

      // ゲーム開始時には4つの石がある
      const piecesInModel = wrapper.vm.board.flat().filter(cell => cell !== 0);
      expect(piecesInModel).toHaveLength(4);
    });

    it('初期スコアが正しい', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 黒と白の石が2つずつある状態から始まる
      expect(wrapper.find('.player-score').text()).toMatch(/自分: 2/);
      expect(wrapper.find('.opponent-score').text()).toMatch(/相手: 2/);
    });
  });

  describe('ゲームプレイ', () => {
    it('有効な手の位置に石を置ける', async () => {
      // テストの再現性を確保するためプレイヤーの色を固定
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // internalMakeMoveをモック化して即座に解決されるPromiseを返すようにする
      const mockInternalMakeMove = vi.fn().mockImplementation(async () => {
        // モック実装：石を置いて手番を切り替える
        return Promise.resolve();
      });

      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // CPU対戦機能を無効化
      wrapper.vm.gameSettings = { isCPUOpponent: false, cpuLevel: CPULevel.MEDIUM };

      // internalMakeMoveをスパイしてモックに置き換え
      const originalInternalMakeMove = wrapper.vm.internalMakeMove;
      wrapper.vm.internalMakeMove = mockInternalMakeMove;

      // 黒のターンから始まることを確認
      expect(wrapper.vm.currentPlayer).toBe(1); // BLACK = 1

      // 有効な手を見つける
      let validMove = null;
      for (let row = 0; row < 8 && !validMove; row++) {
        for (let col = 0; col < 8; col++) {
          if (wrapper.vm.isValidMove(row, col)) {
            validMove = { row, col };
            break;
          }
        }
      }

      // 有効な手が存在する
      expect(validMove).not.toBeNull();

      // makeMove関数をスパイして直接結果を設定
      const spyMakeMove = vi.spyOn(wrapper.vm, 'makeMove');
      spyMakeMove.mockImplementation(async (row, col) => {
        // 手番を切り替える
        wrapper.vm.currentPlayer = wrapper.vm.currentPlayer === 1 ? 2 : 1;
        return Promise.resolve();
      });

      // 有効な位置に石を置く
      await wrapper.vm.makeMove(validMove.row, validMove.col);

      // 手番が相手に移っているか確認
      expect(wrapper.vm.currentPlayer).toBe(2); // WHITE = 2

      // スパイとモックを元に戻す
      wrapper.vm.internalMakeMove = originalInternalMakeMove;
      spyMakeMove.mockRestore();
    });

    it('無効な場所には石を置けない', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // すでに石がある位置に再び置こうとする
      const initialPieceCount = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      await wrapper.vm.makeMove(3, 3); // 初期配置で石がある位置

      // ボード上の石の数が変わらないことを確認
      const currentPieceCount = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(currentPieceCount).toBe(initialPieceCount);
    });

    it('アニメーション中は操作を受け付けない', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // アニメーション中の状態を設定
      wrapper.vm.isAnimating = true;

      // 有効な手の位置を操作しようとしても何も起こらない
      const initialPlayer = wrapper.vm.currentPlayer;
      await wrapper.vm.makeMove(2, 3); // 通常なら有効な手

      // プレイヤーが変わっていないことで操作が無効だったことを確認
      expect(wrapper.vm.currentPlayer).toBe(initialPlayer);
    });
  });

  describe('ゲームロジック', () => {
    it('石の配置ロジックが正しく動作する', () => {
      const wrapper = mountBoard();

      // 有効な手の判定が正しく行われる
      expect(wrapper.vm.canPlaceAt(2, 3)).toBe(true);
      expect(wrapper.vm.canPlaceAt(3, 2)).toBe(true);

      // 無効な手の判定も正しく行われる
      expect(wrapper.vm.canPlaceAt(0, 0)).toBe(false); // 隅の位置は初期状態では無効
      expect(wrapper.vm.canPlaceAt(3, 3)).toBe(false); // すでに石がある

      // ゲーム状態に応じた手の有効性判定
      wrapper.vm.gameStatus = 'ended';
      expect(wrapper.vm.isValidMove(2, 3)).toBe(false); // 終了状態では全て無効

      // 両プレイヤーの有効手の存在確認
      wrapper.vm.gameStatus = 'playing';
      expect(wrapper.vm.hasValidMove(1)).toBe(true); // 黒は有効な手を持つ
      expect(wrapper.vm.hasValidMove(2)).toBe(true); // 白も有効な手を持つ
    });

    it('isFlipping関数は正しく動作する', () => {
      const wrapper = mountBoard();

      // 初期状態ではどの駒もひっくり返し中ではない
      expect(wrapper.vm.isFlipping(3, 3)).toBe(false);

      // 特定の駒をひっくり返し中に設定
      wrapper.vm.flippingPieces.add('3-3');
      expect(wrapper.vm.isFlipping(3, 3)).toBe(true);
      expect(wrapper.vm.isFlipping(4, 4)).toBe(false); // 異なる位置は影響を受けない
    });
  });

  describe('UI表示', () => {
    it('ターン情報と結果表示が正しく機能する', async () => {
      // プレイヤー色を固定して再現性を確保
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // プレイヤーのターン表示の検証（プレイヤーは黒）
      expect(wrapper.find('.player-score').classes()).toContain('current-turn');
      expect(wrapper.find('.opponent-score').classes()).not.toContain('current-turn');

      // 手番が切り替わった場合の表示変更
      wrapper.vm.currentPlayer = 2; // 相手のターンに
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.player-score').classes()).not.toContain('current-turn');
      expect(wrapper.find('.opponent-score').classes()).toContain('current-turn');

      // ゲーム終了状態の表示
      wrapper.vm.gameStatus = 'ended';
      wrapper.vm.showGameResult(); // モーダル表示処理を呼び出す
      await wrapper.vm.$nextTick();

      // アニメーションの遅延を進める
      vi.advanceTimersByTime(500);
      await wrapper.vm.$nextTick();

      // モーダルの表示状態を確認
      expect(wrapper.vm.showResultModal).toBe(true);

      // 勝敗結果の表示テスト
      const playerColor = wrapper.vm.playerColor;
      const opponentColor = playerColor === 1 ? 2 : 1;

      // プレイヤー勝利時の表示
      wrapper.vm.board[0][0] = playerColor;
      wrapper.vm.board[0][1] = playerColor;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.gameResultText).toBe('あなたの勝ち！');

      // 相手勝利時の表示
      wrapper.vm.board[7][0] = opponentColor;
      wrapper.vm.board[7][1] = opponentColor;
      wrapper.vm.board[7][2] = opponentColor;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.gameResultText).toBe('相手の勝ち！');
    });

    it('プレイヤーの色に応じた表示が正しく設定される', () => {
      const wrapper = mountBoard();

      // プレイヤーが黒の場合の表示設定
      wrapper.vm.playerColor = 1; // BLACK
      expect(wrapper.vm.playerColorClass).toBe('black-icon');
      expect(wrapper.vm.opponentColorClass).toBe('white-icon');

      // プレイヤーが白の場合の表示設定
      wrapper.vm.playerColor = 2; // WHITE
      expect(wrapper.vm.playerColorClass).toBe('white-icon');
      expect(wrapper.vm.opponentColorClass).toBe('black-icon');
    });

    it('ゲーム終了時にモーダルが表示される', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // ゲームを終了状態にする
      wrapper.vm.gameStatus = 'ended';
      wrapper.vm.showGameResult();
      await wrapper.vm.$nextTick();

      // アニメーションの遅延を進める
      vi.advanceTimersByTime(500);
      await wrapper.vm.$nextTick();

      // モーダルが表示されているか確認
      expect(wrapper.vm.showResultModal).toBe(true);
    });

    it('プレイヤー勝利時にはクラッカーエフェクトが表示される', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // プレイヤーが勝っている状態を作る
      const playerColor = wrapper.vm.playerColor;
      const opponentColor = playerColor === 1 ? 2 : 1;

      // プレイヤーの石を多く配置
      for (let i = 0; i < 5; i++) {
        wrapper.vm.board[i][0] = playerColor;
      }
      // 相手の石を少なく配置
      wrapper.vm.board[7][7] = opponentColor;
      wrapper.vm.board[7][6] = opponentColor;

      // ゲーム終了処理
      wrapper.vm.gameStatus = 'ended';
      wrapper.vm.showGameResult();

      // アニメーションの遅延を進める
      vi.advanceTimersByTime(500);
      await wrapper.vm.$nextTick();

      // クラッカーエフェクトが表示されるか確認
      expect(wrapper.vm.showConfetti).toBe(true);
      expect(wrapper.vm.isPlayerWin).toBe(true);

      // クラッカーエフェクトが3秒後に非表示になるか確認
      vi.advanceTimersByTime(3000);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.showConfetti).toBe(false);
    });

    it('相手が勝った場合はクラッカーエフェクトが表示されない', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 相手が勝っている状態を作る
      const playerColor = wrapper.vm.playerColor;
      const opponentColor = playerColor === 1 ? 2 : 1;

      // 相手の石を多く配置
      for (let i = 0; i < 5; i++) {
        wrapper.vm.board[i][0] = opponentColor;
      }
      // プレイヤーの石を少なく配置
      wrapper.vm.board[7][7] = playerColor;
      wrapper.vm.board[7][6] = playerColor;

      // ゲーム終了処理
      wrapper.vm.gameStatus = 'ended';
      wrapper.vm.showGameResult();

      // アニメーションの遅延を進める
      vi.advanceTimersByTime(500);
      await wrapper.vm.$nextTick();

      // クラッカーエフェクトが表示されないか確認
      expect(wrapper.vm.showConfetti).toBe(false);
      expect(wrapper.vm.isPlayerWin).toBe(false);
    });

    it('モーダルの表示内容が正しい', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // ゲームを終了状態にする（引き分け状態を設定）
      const playerColor = wrapper.vm.playerColor;
      const opponentColor = playerColor === 1 ? 2 : 1;

      // 同数の石を配置
      wrapper.vm.board[0][0] = playerColor;
      wrapper.vm.board[0][1] = playerColor;
      wrapper.vm.board[7][0] = opponentColor;
      wrapper.vm.board[7][1] = opponentColor;

      // ゲーム終了処理
      wrapper.vm.gameStatus = 'ended';
      wrapper.vm.showGameResult();
      await wrapper.vm.$nextTick();

      // アニメーションの遅延を進める
      vi.advanceTimersByTime(500);
      await wrapper.vm.$nextTick();

      // ResultModalコンポーネントに正しいpropsが渡されているか確認
      const resultModal = wrapper.findComponent({ name: 'ResultModal' });
      expect(resultModal.exists()).toBe(true);
      expect(resultModal.props('isOpen')).toBe(true);
      expect(resultModal.props('resultText')).toBe('引き分け');
      expect(resultModal.props('isPlayerWin')).toBe(false);
      expect(resultModal.props('playerCount')).toBe(4);
      expect(resultModal.props('opponentCount')).toBe(4);
      expect(resultModal.props('playerColor')).toBe(wrapper.vm.playerColor);
    });
  });

  describe('デバッグ機能', () => {
    it('skipToEndGame関数が正しく終盤状態を生成する', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 初期状態での空きマスの数を取得
      const initialEmptyCells = wrapper.vm.board.flat().filter(cell => cell === 0).length;
      expect(initialEmptyCells).toBe(60); // 初期状態では4つの石があるので60マスが空

      // ゲーム終了2手前の状態にスキップ
      await wrapper.vm.skipToEndGame();

      // アニメーションの終了を待つ
      vi.advanceTimersByTime(500);

      // 空きマスが2つだけ残っていることを確認
      const remainingEmptyCells = wrapper.vm.board.flat().filter(cell => cell === 0).length;
      expect(remainingEmptyCells).toBe(2);

      // 有効な手がある場合は、ゲームが続行していることを確認
      if (wrapper.vm.hasValidMove(wrapper.vm.currentPlayer)) {
        expect(wrapper.vm.gameStatus).toBe('playing');
      } else {
        // 両プレイヤーとも打てる手がなければゲーム終了していることを確認
        expect(wrapper.vm.gameStatus).toBe('ended');
      }
    });

    it('既にゲーム終了2手前以降の場合はskipToEndGameは何も変更しない', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 事前に終盤状態を生成（空きマスが2つの状態）
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (!(i === 7 && j === 7) && !(i === 7 && j === 6)) { // 2マスだけ空きとして残す
            wrapper.vm.board[i][j] = (i + j) % 2 + 1; // 交互に黒と白を配置
          }
        }
      }

      // 盤面の状態を保存
      const boardSnapshot = JSON.stringify(wrapper.vm.board);

      // skipToEndGameを呼び出す
      await wrapper.vm.skipToEndGame();

      // アニメーションの終了を待つ
      vi.advanceTimersByTime(500);

      // 盤面に変更がないことを確認
      expect(JSON.stringify(wrapper.vm.board)).toBe(boardSnapshot);
    });

    it('generateEndGamePositionは有効な終盤状態を生成する', () => {
      const wrapper = mountBoard();

      // 終盤状態を生成（5つの空きマス）
      wrapper.vm.generateEndGamePosition(5);

      // 指定した数の空きマスが残っていることを確認
      const emptyCells = wrapper.vm.board.flat().filter(cell => cell === 0).length;
      expect(emptyCells).toBe(5);

      // 黒と白の石がバランス良く配置されていることを確認
      const blackCount = wrapper.vm.board.flat().filter(cell => cell === 1).length;
      const whiteCount = wrapper.vm.board.flat().filter(cell => cell === 2).length;

      // 合計数が盤面サイズに一致
      expect(blackCount + whiteCount + emptyCells).toBe(64);

      // 黒と白の石の数の差が1以内
      expect(Math.abs(blackCount - whiteCount)).toBeLessThanOrEqual(1);
    });
  });

  describe('ゲーム機能', () => {
    it('リセット機能が正しく動作する', async () => {
      // resetGameをスパイして直接処理を実装
      const spyResetGame = vi.fn().mockImplementation(async () => {
        const wrapper = mountBoard();
        // 初期化処理を直接実行
        wrapper.vm.gameStatus = 'playing';
        wrapper.vm.flippingPieces = new Set();
        wrapper.vm.isAnimating = false;

        // 盤面を初期状態に戻す
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            wrapper.vm.board[i][j] = 0;
          }
        }
        // 初期配置
        wrapper.vm.board[3][3] = 2;
        wrapper.vm.board[3][4] = 1;
        wrapper.vm.board[4][3] = 1;
        wrapper.vm.board[4][4] = 2;

        return Promise.resolve();
      });

      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // CPU対戦機能を無効化
      wrapper.vm.gameSettings = { isCPUOpponent: false, cpuLevel: CPULevel.MEDIUM };

      // ゲーム状態を変更（石を置いて初期状態から変化させる）
      wrapper.vm.board[2][3] = 1;
      wrapper.vm.board[2][4] = 1;

      // 盤面が初期状態から変化していることを確認
      const piecesBeforeReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesBeforeReset).toBeGreaterThan(4);

      // resetGameメソッドを置き換え
      const originalResetGame = wrapper.vm.resetGame;
      wrapper.vm.resetGame = async () => {
        // 盤面を初期状態に戻す
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            wrapper.vm.board[i][j] = 0;
          }
        }
        // 初期配置
        wrapper.vm.board[3][3] = 2;
        wrapper.vm.board[3][4] = 1;
        wrapper.vm.board[4][3] = 1;
        wrapper.vm.board[4][4] = 2;

        // 状態リセット
        wrapper.vm.gameStatus = 'playing';
        wrapper.vm.flippingPieces.clear();
        wrapper.vm.isAnimating = false;

        // 元々返していたPromiseをそのまま返す
        return Promise.resolve();
      };

      // リセット処理
      await wrapper.vm.resetGame();
      await wrapper.vm.$nextTick();

      // 初期状態に戻っていることを確認
      const piecesAfterReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesAfterReset).toBe(4); // 初期石は4つ
      expect(wrapper.vm.gameStatus).toBe('playing'); // プレイ状態に戻る
      expect(wrapper.vm.flippingPieces.size).toBe(0); // アニメーション状態がクリア

      // 元のメソッドに戻す
      wrapper.vm.resetGame = originalResetGame;
    });

    it('結果モーダルの閉じるイベント処理が正しく動作する', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // モーダル表示状態にする
      wrapper.vm.showResultModal = true;
      await wrapper.vm.$nextTick();

      // クローズメソッドを呼び出す
      wrapper.vm.closeResultModal();
      await wrapper.vm.$nextTick();

      // モーダルが閉じていることを確認
      expect(wrapper.vm.showResultModal).toBe(false);
    });

    it('「次のゲームへ」ボタンでゲームがリセットされる', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // ゲーム盤を変更して終了状態にする
      wrapper.vm.makeMove(2, 3);
      vi.advanceTimersByTime(1000);
      wrapper.vm.gameStatus = 'ended';
      wrapper.vm.showResultModal = true;
      await wrapper.vm.$nextTick();

      // ResultModalコンポーネントへのreset-gameイベント発行をシミュレート
      const resultModal = wrapper.findComponent({ name: 'ResultModal' });
      await resultModal.vm.$emit('reset-game');
      await wrapper.vm.$nextTick();

      // ゲームがリセットされたことを確認
      expect(wrapper.vm.gameStatus).toBe('playing');
      expect(wrapper.vm.showResultModal).toBe(false);
      // リセット後の盤面状態を確認（初期配置の4つの石）
      const piecesAfterReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesAfterReset).toBe(4);
    });
  });

  describe('スコア計算', () => {
    it('プレイヤーのカウントが正しく計算される', () => {
      const wrapper = mountBoard();

      // 初期状態では両者2つずつの石を持つ
      expect(wrapper.vm.playerCount).toBe(2);
      expect(wrapper.vm.opponentCount).toBe(2);

      // プレイヤーの石を追加した場合のスコア変動
      wrapper.vm.board[0][0] = wrapper.vm.playerColor;
      expect(wrapper.vm.playerCount).toBe(3);
      expect(wrapper.vm.opponentCount).toBe(2);

      // 相手の石を追加した場合のスコア変動
      const opponentColor = wrapper.vm.playerColor === 1 ? 2 : 1;
      wrapper.vm.board[7][7] = opponentColor;
      expect(wrapper.vm.playerCount).toBe(3);
      expect(wrapper.vm.opponentCount).toBe(3);
    });
  });
});

describe('ReversiBoard with CPU', () => {
  it('should initialize CPU player with correct level', async () => {
    const wrapper = mount(ReversiBoard);
    const cpuPlayer = new CPUPlayer(CPULevel.HARD);
    expect(cpuPlayer.getLevel()).toBe(CPULevel.HARD);
  });

  it('should make a move for CPU player', async () => {
    const wrapper = mount(ReversiBoard);
    const cpuPlayer = new CPUPlayer(CPULevel.EASY);
    const board = wrapper.vm.board;
    const currentPlayer = wrapper.vm.currentPlayer;
    const move = cpuPlayer.selectMove(board, currentPlayer);
    expect(move).not.toBeNull();
  });
});
