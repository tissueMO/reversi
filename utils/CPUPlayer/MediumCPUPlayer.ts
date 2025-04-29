import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from '../GameLogic/constants';
import { CPULevel } from './index';

/**
 * 中級CPUプレイヤークラス
 * ※角優先・角隣接回避・最大ひっくり返し数優先(貪欲法)の戦略を取る
 */
export class MediumCPUPlayer extends BaseCPUPlayer {
  /**
   * コンストラクター
   */
  constructor() {
    super(CPULevel.MEDIUM);
  }

  /**
   * {@inheritdoc}
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    const corners: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 7 },
      { row: 7, col: 0 },
      { row: 7, col: 7 },
    ];
    const dangerousMoves: Position[] = [
      { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
      { row: 0, col: 6 }, { row: 1, col: 6 }, { row: 1, col: 7 },
      { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 7, col: 1 },
      { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 7, col: 6 },
    ];

    for (const move of validMoves) {
      if (corners.some(corner => corner.row === move.row && corner.col === move.col)) {
        return move;
      }
    }

    const moveScores: { move: Position; score: number }[] = validMoves
      .map((move) => {
        if (dangerousMoves.some(pos => pos.row === move.row && pos.col === move.col)) {
          return { move, score: -10 };
        }
        const flippedPieces = this.getFlippablePieces(board, currentPlayer, move.row, move.col);
        return { move, score: flippedPieces.length };
      })
      .toSorted((a, b) => b.score - a.score);

    return moveScores[0].move;
  }
}
