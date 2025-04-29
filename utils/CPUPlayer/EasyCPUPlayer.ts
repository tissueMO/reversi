import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from '../GameLogic/constants';
import { CPULevel } from './index';

/**
 * 初級CPUプレイヤークラス
 * ※有効手からランダムに選択する戦略を取る
 */
export class EasyCPUPlayer extends BaseCPUPlayer {
  /**
   * コンストラクター
   */
  constructor() {
    super(CPULevel.EASY);
  }

  /**
   * {@inheritdoc}
   */
  protected async selectMoveByStrategy(_board: number[][], _currentPlayer: number, validMoves: Position[]): Promise<Position> {
    const randomIndex: number = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}
