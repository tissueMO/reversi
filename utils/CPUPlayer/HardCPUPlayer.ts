import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from '../GameLogic/constants';
import { CPULevel } from './index';
import { BLACK, EMPTY, WHITE } from '../GameLogic/constants';

/**
 * 上級CPUプレイヤークラス
 * ※重み付け評価・終盤石数最大化・有効手減少の戦略を取る
 */
export class HardCPUPlayer extends BaseCPUPlayer {
  /**
   * コンストラクター
   */
  constructor() {
    super(CPULevel.HARD);
  }

  /**
   * この戦略を外部から利用できるようにします。
   */
  public async selectMoveUsingHardStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    return this.selectMoveByStrategy(board, currentPlayer, validMoves);
  }

  /**
   * {@inheritdoc}
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
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

    // 終盤判定
    const isEndgame: boolean = emptyCount < 16;

    const moveScores: { move: Position; score: number }[] = validMoves
      .map((move) => {
        const testBoard = this.getResultBoard(board, currentPlayer, move);
        let score = 0;

        if (isEndgame) {
          // 終盤戦略: 石数最大化
          score = testBoard
            .flat()
            .filter((cell) => cell === currentPlayer).length;
        } else {
          // 通常戦略: 重み付け評価・相手の有効手を減らす
          score += weightBoard[move.row][move.col];

          const flippedPieces = this.getFlippablePieces(
            board,
            currentPlayer,
            move.row,
            move.col,
          );

          score += flippedPieces.length;

          const opponent = currentPlayer === BLACK ? WHITE : BLACK;
          const opponentMoves = this.getValidMoves(testBoard, opponent);
          score -= opponentMoves.length * 2;
        }

        return { move, score };
      })
      .toSorted((a, b) => b.score - a.score);

    return moveScores[0].move;
  }
}
