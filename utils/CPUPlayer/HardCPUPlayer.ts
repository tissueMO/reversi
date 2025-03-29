import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position} from './types';
import { CPULevel, EMPTY } from './types';

/**
 * 上級難易度のCPUプレイヤー
 * 高度な戦略を使って手を選択する
 */
export class HardCPUPlayer extends BaseCPUPlayer {
  constructor() {
    super(CPULevel.HARD);
  }

  /**
   * 外部クラスからも利用可能な戦略選択メソッド
   * フォールバック用途などで他のクラスから使用する
   */
  public async selectMoveUsingHardStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    return this.selectMoveByStrategy(board, currentPlayer, validMoves);
  }

  /**
   * 上級難易度の手の選択
   * 高度な戦略: 角を最優先し、端の列を重視、角の隣は避ける、評価関数を使った盤面評価
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    // 評価用の重み付けボード
    // 角が最も価値が高く、角の隣は避ける、端は安定した石を置きやすい
    const weightBoard = [
      [100, -20, 10, 5, 5, 10, -20, 100],
      [-20, -30, 1, 1, 1, 1, -30, -20],
      [10, 1, 5, 2, 2, 5, 1, 10],
      [5, 1, 2, 1, 1, 2, 1, 5],
      [5, 1, 2, 1, 1, 2, 1, 5],
      [10, 1, 5, 2, 2, 5, 1, 10],
      [-20, -30, 1, 1, 1, 1, -30, -20],
      [100, -20, 10, 5, 5, 10, -20, 100],
    ];

    // ゲームの終盤かどうかを判定（空きマスが少なくなったら）
    const emptyCount = board.flat().filter(cell => cell === EMPTY).length;
    const isEndgame = emptyCount < 16; // 残り16マス以下で終盤とみなす

    // 各手の評価
    const moveScores = validMoves.map(move => {
      // 仮に石を置いてみる
      const testBoard = this.getResultBoard(board, currentPlayer, move);

      // 終盤は単純に石の数で評価
      if (isEndgame) {
        const pieceCount = testBoard.flat().filter(cell => cell === currentPlayer).length;
        return { move, score: pieceCount };
      }
      // 終盤でなければ評価関数を使って評価
      else {
        let score = 0;

        // 位置の重みを加算
        score += weightBoard[move.row][move.col];

        // 反転する石の数も考慮
        const flippedPieces = this.getFlippablePieces(board, currentPlayer, move.row, move.col);
        score += flippedPieces.length;

        // 相手の有効手が少なくなるような手を評価
        const opponent = currentPlayer === 1 ? 2 : 1;
        const opponentMoves = this.getValidMoves(testBoard, opponent);
        score -= opponentMoves.length * 2;

        return { move, score };
      }
    });

    // 評価値の高い順にソート
    moveScores.sort((a, b) => b.score - a.score);

    // 最も評価値の高い手を選択
    return moveScores[0].move;
  }
}
