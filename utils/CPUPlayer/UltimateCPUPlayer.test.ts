import { describe, it, expect, vi } from 'vitest';
import { UltimateCPUPlayer } from './UltimateCPUPlayer';

class TestableUltimateCPUPlayer extends UltimateCPUPlayer {
  public setModelLoaded(val: boolean) {
    // @ts-ignore
    this.modelLoaded = val;
  }
  public setModel(model: any) {
    // @ts-ignore
    this.model = model;
  }
}

describe('UltimateCPUPlayer', () => {
  it('特徴的な手選択：モデル読み込み失敗時は上級戦略にフォールバックする', async () => {
    const player = new TestableUltimateCPUPlayer();
    player.setModelLoaded(false);
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

  it('特徴的な手選択：モデル読み込み成功時はAI推論で手を選ぶ（モック）', async () => {
    const player = new TestableUltimateCPUPlayer();
    player.setModelLoaded(true);
    player.setModel({
      predict: vi.fn(() => ({
        dataSync: () => [
          0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      })),
    });
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

  it('有効手がない場合はnullを返す', async () => {
    const player = new TestableUltimateCPUPlayer();
    player.setModelLoaded(true);
    player.setModel({
      predict: vi.fn(() => ({ dataSync: () => Array(64).fill(0) })),
    });
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
