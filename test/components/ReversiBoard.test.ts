import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReversiBoard from '../../components/ReversiBoard.vue';

describe('ReversiBoard', () => {
  // テスト用のコンポーネントをマウントする関数
  function mountBoard() {
    return mount(ReversiBoard, {
      attachTo: document.body
    });
  }

  // タイマー系のテストのためのセットアップ
  beforeEach(() => {
    vi.useFakeTimers();
  });

  // テスト後にタイマーをリセット
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('初期化', () => {
    it('ボードが正しく初期化される', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // ボードが8x8であることを確認
      const rows = wrapper.findAll('.board-row');
      expect(rows).toHaveLength(8);

      // 各行に8つのセルがあることを確認
      rows.forEach(row => {
        expect(row.findAll('.board-cell')).toHaveLength(8);
      });

      // データモデルで初期石が4つあることを確認
      const piecesInModel = wrapper.vm.board.flat().filter(cell => cell !== 0);
      expect(piecesInModel).toHaveLength(4);
    });

    it('初期スコアが正しい', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 初期状態では黒と白がそれぞれ2つずつ
      expect(wrapper.find('.player-score').text()).toMatch(/自分: 2/);
      expect(wrapper.find('.opponent-score').text()).toMatch(/相手: 2/);
    });
  });

  describe('ゲームプレイ', () => {
    it('有効な手の位置に石を置ける', async () => {
      // プレイヤーを黒に固定
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 初期状態では黒のターン
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

      expect(validMove).not.toBeNull();

      // 石を置く前のピースの数を記録
      const initialPieceCount = wrapper.vm.board.flat().filter(cell => cell !== 0).length;

      // 有効な位置に石を置く
      await wrapper.vm.makeMove(validMove.row, validMove.col);

      // アニメーション終了を模擬
      vi.advanceTimersByTime(1000);
      wrapper.vm.flippingPieces.clear();
      wrapper.vm.isAnimating = false;

      // ターンが相手に移ったことを確認
      expect(wrapper.vm.currentPlayer).toBe(2); // WHITE = 2
    });

    it('無効な場所には石を置けない', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // すでに石がある場所に石を置こうとする
      const initialPieceCount = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      await wrapper.vm.makeMove(3, 3); // すでに石がある中央の位置

      // 石の数が変わらないことを確認
      const currentPieceCount = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(currentPieceCount).toBe(initialPieceCount);
    });

    it('アニメーション中は操作を受け付けない', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // アニメーション中に設定
      wrapper.vm.isAnimating = true;

      // 操作を試みる
      const initialPlayer = wrapper.vm.currentPlayer;
      await wrapper.vm.makeMove(2, 3); // 通常なら有効な手

      // プレイヤーが変わっていないことを確認（操作が受け付けられていない）
      expect(wrapper.vm.currentPlayer).toBe(initialPlayer);
    });
  });

  describe('ゲームロジック', () => {
    it('石の配置ロジックが正しく動作する', () => {
      const wrapper = mountBoard();

      // 有効な手の検証
      expect(wrapper.vm.canPlaceAt(2, 3)).toBe(true);
      expect(wrapper.vm.canPlaceAt(3, 2)).toBe(true);

      // 無効な手の検証
      expect(wrapper.vm.canPlaceAt(0, 0)).toBe(false); // 角
      expect(wrapper.vm.canPlaceAt(3, 3)).toBe(false); // すでに石がある

      // ゲーム終了状態では全ての手が無効
      wrapper.vm.gameStatus = 'ended';
      expect(wrapper.vm.isValidMove(2, 3)).toBe(false);

      // 初期状態では両プレイヤーとも有効な手がある
      wrapper.vm.gameStatus = 'playing';
      expect(wrapper.vm.hasValidMove(1)).toBe(true); // BLACK = 1
      expect(wrapper.vm.hasValidMove(2)).toBe(true); // WHITE = 2
    });

    it('isFlipping関数は正しく動作する', () => {
      const wrapper = mountBoard();

      // 初期状態ではどの駒もひっくり返し中ではない
      expect(wrapper.vm.isFlipping(3, 3)).toBe(false);

      // 特定の駒をひっくり返し中に設定
      wrapper.vm.flippingPieces.add('3-3');
      expect(wrapper.vm.isFlipping(3, 3)).toBe(true);
      expect(wrapper.vm.isFlipping(4, 4)).toBe(false);
    });
  });

  describe('UI表示', () => {
    it('ターン情報と結果表示が正しく機能する', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 初期状態ではプレイヤーのターン
      expect(wrapper.find('.turn-info').text()).toBe('あなたの番です');

      // 相手のターンに切り替え
      wrapper.vm.currentPlayer = 2;
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.turn-info').text()).toBe('相手の番です');

      // ゲーム終了状態
      wrapper.vm.gameStatus = 'ended';
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.turn-info').text()).toBe('ゲーム終了');
      expect(wrapper.find('.game-result').exists()).toBe(true);
      expect(wrapper.find('.result-text').text()).toBe('引き分け');

      // 勝敗結果のテキスト
      const playerColor = wrapper.vm.playerColor;
      const opponentColor = playerColor === 1 ? 2 : 1;

      // プレイヤー勝利
      wrapper.vm.board[0][0] = playerColor;
      wrapper.vm.board[0][1] = playerColor;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.gameResultText).toBe('あなたの勝ち！');

      // 相手勝利
      wrapper.vm.board[7][0] = opponentColor;
      wrapper.vm.board[7][1] = opponentColor;
      wrapper.vm.board[7][2] = opponentColor;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.gameResultText).toBe('相手の勝ち！');
    });

    it('プレイヤーの色に応じた表示が正しく設定される', () => {
      const wrapper = mountBoard();

      // プレイヤーが黒の場合
      wrapper.vm.playerColor = 1;
      expect(wrapper.vm.playerColorClass).toBe('black-icon');
      expect(wrapper.vm.opponentColorClass).toBe('white-icon');
      expect(wrapper.vm.playerColorText).toBe('黒');
      expect(wrapper.vm.opponentColorText).toBe('白');

      // プレイヤーが白の場合
      wrapper.vm.playerColor = 2;
      expect(wrapper.vm.playerColorClass).toBe('white-icon');
      expect(wrapper.vm.opponentColorClass).toBe('black-icon');
      expect(wrapper.vm.playerColorText).toBe('白');
      expect(wrapper.vm.opponentColorText).toBe('黒');
    });
  });

  describe('ゲーム機能', () => {
    it('リセット機能が正しく動作する', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // 適当な位置に石を置いてゲーム状態を変える
      if (wrapper.vm.isValidMove(2, 3)) {
        await wrapper.vm.makeMove(2, 3);
      }

      // ボードが初期状態から変わっていることを確認
      const piecesBeforeReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesBeforeReset).toBeGreaterThan(4);

      // リセット
      await wrapper.vm.resetGame();
      await wrapper.vm.$nextTick();

      // ボードが初期状態に戻っていることを確認
      const piecesAfterReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesAfterReset).toBe(4);
      expect(wrapper.vm.gameStatus).toBe('playing');
      expect(wrapper.vm.flippingPieces.size).toBe(0);
      expect(wrapper.vm.isAnimating).toBe(false);
    });
  });

  describe('スコア計算', () => {
    it('プレイヤーのカウントが正しく計算される', () => {
      const wrapper = mountBoard();

      // 初期状態では両者2つずつ
      expect(wrapper.vm.playerCount).toBe(2);
      expect(wrapper.vm.opponentCount).toBe(2);

      // ボード上の石を変更してカウントが更新されるか確認
      wrapper.vm.board[0][0] = wrapper.vm.playerColor;
      expect(wrapper.vm.playerCount).toBe(3);
      expect(wrapper.vm.opponentCount).toBe(2);

      // 相手の石も追加
      const opponentColor = wrapper.vm.playerColor === 1 ? 2 : 1;
      wrapper.vm.board[7][7] = opponentColor;
      expect(wrapper.vm.playerCount).toBe(3);
      expect(wrapper.vm.opponentCount).toBe(3);
    });
  });
});
