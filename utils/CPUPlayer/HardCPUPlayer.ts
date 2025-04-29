import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from './types';
import { CPULevel, EMPTY } from './types';

/**
 * 上級CPUプレイヤークラス
 * 重み付け評価・終盤石数最大化・有効手減少戦略の実装
 */
export class HardCPUPlayer extends BaseCPUPlayer {
  /**
   * コンストラクター
   */
  constructor() {
    super(CPULevel.HARD);
  }

  /**
   * 上級戦略を外部から利用できるようにします。
   */
  public async selectMoveUsingHardStrategy(
    board: number[][],
    currentPlayer: number,
    validMoves: Position[],
  ): Promise<Position> {
    return this.selectMoveByStrategy(board, currentPlayer, validMoves);
  }

  /**
   * 上級難易度の手を選択します。
   * ※角優先・重み付け・終盤石数最大化・相手有効手減少を考慮します。
   */
  protected async selectMoveByStrategy(
    board: number[][],
    currentPlayer: number,
    validMoves: Position[],
  ): Promise<Position> {
    const weightBoard: number[][] = [
      [100, -20, 10, 5, 5, 10, -20, 100],
      [-20, -30, 1, 1, 1, 1, -30, -20],
      [10, 1, 5, 2, 2, 5, 1, 10],
      [5, 1, 2, 1, 1, 2, 1, 5],
      [5, 1, 2, 1, 1, 2, 1, 5],
      [10, 1, 5, 2, 2, 5, 1, 10],
      [-20, -30, 1, 1, 1, 1, -30, -20],
      [100, -20, 10, 5, 5, 10, -20, 100],
    ];
    const emptyCount: number = board
      .flat()
      .filter((cell) => cell === EMPTY).length;
    const isEndgame: boolean = emptyCount < 16;
    const moveScores: { move: Position; score: number }[] = validMoves.map(
      (move) => {
        const testBoard = this.getResultBoard(board, currentPlayer, move);
        if (isEndgame) {
          const pieceCount = testBoard
            .flat()
            .filter((cell) => cell === currentPlayer).length;
          return { move, score: pieceCount };
        } else {
          let score = 0;
          score += weightBoard[move.row][move.col];
          const flippedPieces = this.getFlippablePieces(
            board,
            currentPlayer,
            move.row,
            move.col,
          );
          score += flippedPieces.length;
          const opponent = currentPlayer === 1 ? 2 : 1;
          const opponentMoves = this.getValidMoves(testBoard, opponent);
          score -= opponentMoves.length * 2;
          return { move, score };
        }
      },
    );
    moveScores.sort((a, b) => b.score - a.score);
    return moveScores[0].move;
  }
}
