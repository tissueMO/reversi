import { describe, it, expect, vi } from 'vitest';
import { EasyCPUPlayer } from './EasyCPUPlayer';

describe('EasyCPUPlayer', () => {
  it('特徴的な手選択：有効な手からランダムに選択する', async () => {
    const player = new EasyCPUPlayer();
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
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const move = await player.selectMove(board, 1);
    expect(move).not.toBeNull();
    vi.restoreAllMocks();
  });

  it('特徴的な手選択：複数回呼ぶと異なる手が返ることがある', async () => {
    const player = new EasyCPUPlayer();
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
    const moves = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const move = await player.selectMove(board, 1);
      if (move) {
        moves.add(`${move.row},${move.col}`);
      }
    }
    expect(moves.size).toBeGreaterThan(1);
  });

  it('有効手がない場合はnullを返す', async () => {
    const player = new EasyCPUPlayer();
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
