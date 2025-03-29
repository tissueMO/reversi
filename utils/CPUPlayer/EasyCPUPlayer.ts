import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from './types';
import { CPULevel } from './types';

/**
 * 初級難易度のCPUプレイヤー
 * ランダムな手を選択する
 */
export class EasyCPUPlayer extends BaseCPUPlayer {
  constructor() {
    super(CPULevel.EASY);
  }

  /**
   * 初級難易度の手の選択（ランダム）
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    // 有効な手からランダムに選択
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}
