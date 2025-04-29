import type { Ref } from 'vue';
import { ref } from 'vue';
import type { Position } from '../GameLogic/constants';
import { AnimationManager } from './AnimationManager';

/**
 * 石の反転アニメーション管理クラス
 */
export class FlipAnimationManager extends AnimationManager {
  private flippingPieces: Ref<Set<string>>;
  private isAnimatingRef: Ref<boolean>;

  /**
   * コンストラクター
   */
  constructor() {
    super();
    this.flippingPieces = ref(new Set<string>());
    this.isAnimatingRef = ref(false);
  }

  /**
   * 指定位置がアニメーション中かどうかを返します。
   */
  public isFlipping(row: number, col: number): boolean {
    return this.flippingPieces.value.has(`${row}-${col}`);
  }

  /**
   * アニメーション状態をリセットします。
   */
  public override reset(): void {
    this.flippingPieces.value.clear();
    this.isAnimatingRef.value = false;
  }

  /**
   * アニメーション中かどうかを返します。
   */
  public override get isAnimating(): Ref<boolean> {
    return this.isAnimatingRef;
  }

  /**
   * アニメーション状態を手動で設定します。
   */
  public setAnimating(value: boolean): void {
    this.isAnimatingRef.value = value;
  }

  /**
   * 反転アニメーション中の石セットを返します。
   */
  public get flipping(): Ref<Set<string>> {
    return this.flippingPieces;
  }

  /**
   * 石の反転アニメーションを実行します。
   * ※同心円状に広がるアニメーションを実現します。
   */
  public async animateFlip(placedPosition: Position, flippedPieces: Position[]): Promise<void> {
    this.isAnimatingRef.value = true;

    // 距離順アニメーションのための並び替え
    const allFlips: Array<{position: Position, distance: number}> = flippedPieces
      .map(pos => {
        const dx = pos.row - placedPosition.row;
        const dy = pos.col - placedPosition.col;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { position: pos, distance };
      })
      .toSorted((a, b) => a.distance - b.distance);

    // 並列アニメーション実行
    const animationPromises: Promise<void>[] = [];
    for (const flip of allFlips) {
      const { row, col } = flip.position;
      const key = `${row}-${col}`;
      const delay = Math.floor(flip.distance * 40);
      const animationPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          this.flippingPieces.value.add(key);
          setTimeout(() => {
            this.flippingPieces.value.delete(key);
            resolve();
          }, 330);
        }, delay);
      });
      animationPromises.push(animationPromise);
    }
    await Promise.all(animationPromises);

    // アニメーション後の余韻待機
    await new Promise<void>(resolve => {
      setTimeout(() => {
        this.isAnimatingRef.value = false;
        resolve();
      }, 300);
    });
  }
}
