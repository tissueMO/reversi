import type { Ref } from 'vue';

/**
 * アニメーション管理インターフェース
 * ※個別アニメーションごとに具象クラスで実装する
 */
export abstract class AnimationManager {
  /**
   * アニメーション中かどうかを返します。
   */
  public abstract get isAnimating(): Ref<boolean>;

  /**
   * アニメーション状態をリセットします。
   */
  public abstract reset(): void;
}
