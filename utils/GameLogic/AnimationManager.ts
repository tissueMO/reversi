import type { Ref } from 'vue';
import { ref } from 'vue';
import type { Position } from './constants';

/**
 * リバーシの石のアニメーション処理を管理するクラス
 * 反転アニメーションの管理、状態追跡を行う
 */
export class AnimationManager {
  /** アニメーション中の駒を管理するセット */
  private _flippingPieces: Ref<Set<string>>;

  /** アニメーション実行中かどうかのフラグ */
  private _isAnimating: Ref<boolean>;

  /**
   * コンストラクタ
   */
  constructor() {
    this._flippingPieces = ref(new Set<string>());
    this._isAnimating = ref(false);
  }

  /**
   * 指定位置の駒がアニメーション中かを判定
   * @param row 行
   * @param col 列
   * @returns アニメーション中かどうか
   */
  public isFlipping(row: number, col: number): boolean {
    return this._flippingPieces.value.has(`${row}-${col}`);
  }

  /**
   * アニメーション状態をリセット
   */
  public reset(): void {
    this._flippingPieces.value.clear();
    this._isAnimating.value = false;
  }

  /**
   * アニメーション中かどうかを返す
   */
  public get isAnimating(): Ref<boolean> {
    return this._isAnimating;
  }

  /**
   * アニメーション状態を手動で設定
   */
  public setAnimating(value: boolean): void {
    this._isAnimating.value = value;
  }

  /**
   * フリッピングピースのセットを取得
   */
  public get flippingPieces(): Ref<Set<string>> {
    return this._flippingPieces;
  }

  /**
   * 石の反転アニメーションを実行
   * @param placedPosition 置いた石の位置
   * @param flippedPieces ひっくり返す石の位置リスト
   * @returns アニメーション完了を通知するPromise
   */
  public async animateFlip(placedPosition: Position, flippedPieces: Position[]): Promise<void> {
    this._isAnimating.value = true;

    // 距離に応じたアニメーション順序のために石の位置を整理
    const allFlips: Array<{position: Position, distance: number}> = flippedPieces.map(pos => {
      const dx = pos.row - placedPosition.row;
      const dy = pos.col - placedPosition.col;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { position: pos, distance };
    });

    // 距離の近い順に並べ替え
    allFlips.sort((a, b) => a.distance - b.distance);

    // 同心円状に広がるアニメーションの実行
    let maxDelay = 0;
    const animationPromises: Promise<void>[] = [];

    for (const flip of allFlips) {
      const { row, col } = flip.position;
      const key = `${row}-${col}`;
      // 距離に応じた遅延でアニメーション
      const delay = Math.floor(flip.distance * 40);
      maxDelay = Math.max(maxDelay, delay);

      // アニメーション開始と終了をPromiseで処理
      const animationPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          // アニメーション開始状態に設定
          this._flippingPieces.value.add(key);

          // アニメーション終了の処理
          setTimeout(() => {
            this._flippingPieces.value.delete(key);
            resolve();
          }, 330); // フリップアニメーション完了までの時間
        }, delay);
      });

      // 並行して実行するためにPromiseを配列に追加
      animationPromises.push(animationPromise);
    }

    // すべてのアニメーションの完了を待機
    await Promise.all(animationPromises);

    // アニメーション後の追加の待機時間
    const pauseAfterAnimation = 300;

    return new Promise<void>(resolve => {
      setTimeout(() => {
        this._isAnimating.value = false;
        resolve();
      }, pauseAfterAnimation);
    });
  }
}
