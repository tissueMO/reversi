/**
 * CPUプレイヤーの難易度レベル
 */
export enum CPULevel {
  EASY = 'easy',      // 初級: ランダムな手を選ぶ
  MEDIUM = 'medium',  // 中級: 基本的な戦略を使う
  HARD = 'hard',      // 上級: 高度な戦略を使う
  ULTIMATE = 'ultimate' // 最強: 学習済みTensorFlowモデルを使う
}

/**
 * マスの状態を表す定数
 */
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

/**
 * 盤面上の位置を表す型
 */
export type Position = {
  row: number;
  col: number;
};
