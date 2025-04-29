import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from '../GameLogic/constants';
import { CPULevel } from './index';

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
  protected async selectMoveByStrategy(_board: number[][], _currentPlayer: number, validMoves: Position[]): Promise<Position> {
    const randomIndex: number = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}
