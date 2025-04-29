/**
 * 空のマス
 */
export const EMPTY = 0;

/**
 * 黒石
 */
export const BLACK = 1;

/**
 * 白石
 */
export const WHITE = 2;

/**
 * 8方向のベクトル定義
 * ※盤面上の移動方向を表す配列
 */
export const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

/**
 * ゲームの状態を表す型
 */
export type GameStatus = 'playing' | 'ended';

/**
 * ゲームモードを表す型
 */
export type GameMode = 'twoPlayers' | 'playerVsCPU' | 'cpuVsCpu';

/**
 * 盤面上の位置を表す型
 */
export type Position = {
  row: number;
  col: number;
};
