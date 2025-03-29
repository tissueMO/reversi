import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from './types';
import { CPULevel } from './types';

/**
 * 中級難易度のCPUプレイヤー
 * 基本的な戦略（角を優先し、角の隣は避ける）を使って手を選択する
 */
export class MediumCPUPlayer extends BaseCPUPlayer {
  constructor() {
    super(CPULevel.MEDIUM);
  }

  /**
   * 中級難易度の手の選択
   * 基本戦略: 角を優先し、角の隣は避ける、それ以外は獲得石数が多い手を選ぶ
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    // 角の位置
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 7 },
      { row: 7, col: 0 },
      { row: 7, col: 7 },
    ];

    // 角の隣の危険な位置
    const dangerousMoves = [
      { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
      { row: 0, col: 6 }, { row: 1, col: 6 }, { row: 1, col: 7 },
      { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 7, col: 1 },
      { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 7, col: 6 },
    ];

    // まず角が取れるかチェック
    for (const move of validMoves) {
      if (corners.some(corner => corner.row === move.row && corner.col === move.col)) {
        return move;
      }
    }

    // 各手の評価値を計算
    const moveScores = validMoves.map(move => {
      // 角の隣は避ける（低い評価値）
      if (dangerousMoves.some(pos => pos.row === move.row && pos.col === move.col)) {
        return { move, score: -10 };
      }

      // それ以外は獲得できる石の数で評価
      const flippedPieces = this.getFlippablePieces(board, currentPlayer, move.row, move.col);
      return { move, score: flippedPieces.length };
    });

    // 評価値の高い順にソート
    moveScores.sort((a, b) => b.score - a.score);

    // 最も評価値の高い手を選択
    return moveScores[0].move;
  }
}
