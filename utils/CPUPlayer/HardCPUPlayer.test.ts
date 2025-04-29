import { describe, it, expect } from 'vitest';
import { HardCPUPlayer } from './HardCPUPlayer';

describe('HardCPUPlayer', () => {
  it('特徴的な手選択：重み付け評価で手を選択する', async () => {
    const player = new HardCPUPlayer();
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 0, 0],
      [0, 0, 0, 1, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).not.toBeNull();
  });

  it('特徴的な手選択：終盤は石数最大化を狙う', async () => {
    const player = new HardCPUPlayer();
    const board = [
      [1, 1, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 2, 1, 1, 1],
      [1, 0, 2, 2, 1, 1, 1, 1],
      [1, 2, 2, 1, 1, 1, 1, 1],
      [1, 2, 1, 2, 1, 1, 1, 1],
      [1, 2, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).toEqual({ row: 2, col: 1 });
  });

  it('特徴的な手選択：相手の有効手を減らす戦略をとる', async () => {
    const player = new HardCPUPlayer();
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 2, 2, 0, 0, 0],
      [0, 0, 2, 1, 2, 0, 0, 0],
      [0, 0, 2, 2, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).toEqual({ row: 2, col: 5 });
  });

  it('有効手がない場合はnullを返す', async () => {
    const player = new HardCPUPlayer();
    const board = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).toBeNull();
  });
});
