import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReversiBoard from '../../components/ReversiBoard.vue';

describe('ReversiBoard', () => {
  /**
   * テストのためのコンポーネントをマウント
   * DOM操作を必要とするテスト向けにdocument.bodyにアタッチする
   */
  function mountBoard () {
    return mount(ReversiBoard, {
      attachTo: document.body,
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

      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

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

      // 有効な位置に石を置く
      await wrapper.vm.makeMove(validMove.row, validMove.col);

      // アニメーション終了を模擬
      vi.advanceTimersByTime(1000);
      wrapper.vm.flippingPieces.clear();
      wrapper.vm.isAnimating = false;

      // 手番が相手に移っているか確認
      expect(wrapper.vm.currentPlayer).toBe(2); // WHITE = 2
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
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.game-result').exists()).toBe(true);
      expect(wrapper.find('.result-text').text()).toBe('引き分け');

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
  });

  describe('ゲーム機能', () => {
    it('リセット機能が正しく動作する', async () => {
      const wrapper = mountBoard();
      await wrapper.vm.$nextTick();

      // ゲーム状態を変更
      if (wrapper.vm.isValidMove(2, 3)) {
        await wrapper.vm.makeMove(2, 3);
      }

      // 盤面が初期状態から変化していることを確認
      const piecesBeforeReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesBeforeReset).toBeGreaterThan(4);

      // リセット処理
      await wrapper.vm.resetGame();
      await wrapper.vm.$nextTick();

      // 初期状態に戻っていることを確認
      const piecesAfterReset = wrapper.vm.board.flat().filter(cell => cell !== 0).length;
      expect(piecesAfterReset).toBe(4); // 初期石は4つ
      expect(wrapper.vm.gameStatus).toBe('playing'); // プレイ状態に戻る
      expect(wrapper.vm.flippingPieces.size).toBe(0); // アニメーション状態がクリア
      expect(wrapper.vm.isAnimating).toBe(false); // アニメーションフラグがリセット
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
