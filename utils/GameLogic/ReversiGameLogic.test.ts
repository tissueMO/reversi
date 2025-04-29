import { describe, it, expect } from 'vitest';
import { ReversiGameLogic } from './ReversiGameLogic';
import { BLACK, EMPTY, WHITE } from './constants';

describe('ReversiGameLogic', () => {
  it('初期化で8x8の盤面と初期石が配置される', () => {
    const logic = new ReversiGameLogic();
    expect(logic.board.length).toBe(8);
    expect(logic.board[0].length).toBe(8);

    const flat = logic.board.flat();
    expect(flat.filter(x => x === BLACK).length).toBe(2);
    expect(flat.filter(x => x === WHITE).length).toBe(2);
  });

  it('有効な手のみ石が置ける', () => {
    const logic = new ReversiGameLogic();
    const valid = logic.getValidMoves(1);
    expect(valid.length).toBeGreaterThan(0);
    const move = valid[0];
    logic.setCurrentPlayer(1);
    const result = logic.placeStone(move.row, move.col);
    expect(result.length > 0).toBe(true);
    expect(logic.board[move.row][move.col]).toBe(BLACK);
  });

  it('無効な場所には石を置けない', () => {
    const logic = new ReversiGameLogic();
    logic.setCurrentPlayer(1);
    const result = logic.placeStone(0, 0);
    expect(result.length > 0).toBe(false);
  });

  it('石を置くと挟まれた石が反転する', () => {
    const logic = new ReversiGameLogic();
    const move = logic.getValidMoves(1)[0];
    logic.placeStone(move.row, move.col);
    const flat = logic.board.flat();
    expect(flat.filter(f => f === BLACK).length).toBe(4);
    expect(flat.filter(f => f === WHITE).length).toBe(1);
  });

  it('石を置ける場所がない場合は空配列を返す', () => {
    const logic = new ReversiGameLogic();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        logic.board[y][x] = BLACK;
      }
    }
    expect(logic.getValidMoves(1)).toEqual([]);
    expect(logic.getValidMoves(2)).toEqual([]);
  });

  it('パス判定が正しく動作する', () => {
    const logic = new ReversiGameLogic();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        logic.board[y][x] = BLACK;
      }
    }
    expect(!logic.hasValidMove(1)).toBe(true);
    expect(!logic.hasValidMove(2)).toBe(true);
  });

  it('ゲーム終了判定が正しい', () => {
    const logic = new ReversiGameLogic();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        logic.board[y][x] = BLACK;
      }
    }
    logic.endGame();
    expect(logic.isGameOver()).toBe(true);
  });

  it('石数カウントが正しい', () => {
    const logic = new ReversiGameLogic();
    logic.board[0][0] = BLACK;
    logic.board[0][1] = WHITE;
    expect(logic.getStoneCount(1)).toBeGreaterThan(0);
    expect(logic.getStoneCount(2)).toBeGreaterThan(0);
  });

  it('盤面コピーが正しく動作する', () => {
    const logic = new ReversiGameLogic();
    const copy = logic.getBoard();
    expect(copy).not.toBe(logic.board);
    expect(copy).toEqual(logic.board);
    copy[0][0] = 9;
    expect(logic.board[0][0]).not.toBe(9);
  });

  it('合法手がない場合にパスが必要', () => {
    const logic = new ReversiGameLogic();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        logic.board[y][x] = BLACK;
      }
    }
    expect(!logic.hasValidMove(1)).toBe(true);
    expect(!logic.hasValidMove(2)).toBe(true);
  });

  it('石を置いた後に合法手がなくなればパスになる', () => {
    const logic = new ReversiGameLogic();
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        logic.board[y][x] = BLACK;
      }
    }
    logic.board[7][7] = EMPTY;
    expect(logic.getValidMoves(2)).toEqual([]);
    expect(!logic.hasValidMove(2)).toBe(true);
  });
});
