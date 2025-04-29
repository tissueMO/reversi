import { describe, it, expect, beforeEach } from 'vitest';
import { FlipAnimationManager } from './FlipAnimationManager';

describe('FlipAnimationManager', () => {
  let manager: FlipAnimationManager;

  beforeEach(() => {
    manager = new FlipAnimationManager();
  });

  it('アニメーション中の石を判定できる', async () => {
    const placed = { row: 3, col: 3 };
    const flips = [
      { row: 3, col: 4 },
      { row: 4, col: 3 },
    ];

    const promise = manager.animateFlip(placed, flips);

    // 直後はまだアニメーション中ではない
    expect(manager.isFlipping(3, 4)).toBe(false);
    expect(manager.isFlipping(4, 3)).toBe(false);

    // 少し待つとアニメーション中になる
    await new Promise(r => setTimeout(r, 50));
    expect(manager.isFlipping(3, 4) || manager.isFlipping(4, 3)).toBe(true);

    // 完了後はアニメーション中ではない
    await promise;
    expect(manager.isFlipping(3, 4)).toBe(false);
    expect(manager.isFlipping(4, 3)).toBe(false);
  });

  it('状態が初期化される', async () => {
    const placed = { row: 2, col: 2 };
    const flips = [{ row: 2, col: 3 }];
    const promise = manager.animateFlip(placed, flips);
    await new Promise(r => setTimeout(r, 30));
    manager.reset();
    expect(manager.isFlipping(2, 3)).toBe(false);
    expect(manager.isAnimating.value).toBe(false);
    await promise;
  });

  it('アニメーション中か判定できる', async () => {
    const placed = { row: 1, col: 1 };
    const flips = [{ row: 1, col: 2 }];
    const promise = manager.animateFlip(placed, flips);
    expect(manager.isAnimating.value).toBe(true);
    await promise;
    expect(manager.isAnimating.value).toBe(false);
  });
});
