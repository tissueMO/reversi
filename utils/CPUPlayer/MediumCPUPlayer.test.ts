import { describe, it, expect } from 'vitest';
import { MediumCPUPlayer } from './MediumCPUPlayer';

describe('MediumCPUPlayer', () => {
  it('特徴的な手選択：角を優先して選択する', async () => {
    const player = new MediumCPUPlayer();
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 0, 0],
      [0, 0, 0, 1, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).toEqual({ row: 0, col: 0 });
  });

  it('特徴的な手選択：角隣接マスを避ける', async () => {
    const player = new MediumCPUPlayer();
    const board = [
      [0, 0, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 2, 2, 2, 2, 2],
      [0, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 1, 1, 1, 1, 1, 1],
      [2, 2, 1, 1, 1, 1, 1, 1],
      [2, 2, 1, 1, 1, 1, 1, 1],
      [2, 2, 1, 1, 1, 1, 1, 1],
      [2, 2, 1, 1, 1, 1, 1, 1],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).toEqual({ row: 2, col: 0 });
  });

  it('特徴的な手選択：最大ひっくり返し数を優先する', async () => {
    const player = new MediumCPUPlayer();
    const board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 2, 2, 0, 0, 0],
      [0, 0, 2, 1, 2, 0, 0, 0],
      [0, 0, 2, 2, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const move = await player.selectMove(board, 1);
    expect(move).toEqual({ row: 0, col: 4 });
  });

  it('有効手がない場合はnullを返す', async () => {
    const player = new MediumCPUPlayer();
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
