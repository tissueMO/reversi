import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from './types';
import { CPULevel } from './types';

/**
 * 初級CPUプレイヤークラス
 * 有効手からランダム選択戦略の実装
 */
export class EasyCPUPlayer extends BaseCPUPlayer {
  /**
   * コンストラクター
   */
  constructor() {
    super(CPULevel.EASY);
  }

  /**
   * 初級難易度の手をランダムに選択します。
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    const randomIndex: number = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}
