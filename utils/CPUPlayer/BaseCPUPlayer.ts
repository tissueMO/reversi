import type { CPULevel } from './index';
import { EMPTY, BLACK, WHITE, DIRECTIONS } from '../GameLogic/constants';
import type { Position } from '../GameLogic/constants';

/**
 * CPU戦略基底クラス
 */
export abstract class BaseCPUPlayer {
  protected level: CPULevel;

  /**
   * コンストラクター
   */
  constructor(level: CPULevel) {
    this.level = level;
  }

  /**
   * 設定されている難易度を返します。
   */
  getLevel(): CPULevel {
    return this.level;
  }

  /**
   * 盤面状況から次の手を決定します。
   */
  async selectMove(board: number[][], currentPlayer: number): Promise<Position | null> {
    const validMoves = this.getValidMoves(board, currentPlayer);
    if (validMoves.length) {
      return await this.selectMoveByStrategy(board, currentPlayer, validMoves);
    } else {
      return null;
    }
  }

  /**
   * 難易度ごとの戦略によって次の手を決定します。
   */
  protected abstract selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position>;

  /**
   * 石を置いた後の盤面を返します。
   */
  protected getResultBoard(board: number[][], player: number, move: Position): number[][] {
    // 元の盤面に影響を与えないようにする
    const newBoard = board.map((row) => [...row]);

    newBoard[move.row][move.col] = player;

    const flippablePieces = this.getFlippablePieces(board, player, move.row, move.col);
    for (const pos of flippablePieces) {
      newBoard[pos.row][pos.col] = player;
    }

    return newBoard;
  }

  /**
   * 指定位置に石を置いた場合にひっくり返せる石リストを返します。
   */
  protected getFlippablePieces(board: number[][], player: number, row: number, col: number): Position[] {
    if (board[row][col] !== EMPTY) {
      return [];
    }

    const opponent = player === BLACK ? WHITE : BLACK;
    const flippablePieces: Position[] = [];

    for (const [dy, dx] of DIRECTIONS) {
      let x = col + dx;
      let y = row + dy;
      const tempFlips: Position[] = [];

      while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y][x] === opponent) {
        tempFlips.push({ row: y, col: x });
        x += dx;
        y += dy;
      }

      if (
        tempFlips.length > 0 &&
        x >= 0 && x < 8 &&
        y >= 0 && y < 8 &&
        board[y][x] === player
      ) {
        flippablePieces.push(...tempFlips);
      }
    }

    return flippablePieces;
  }

  /**
   * 指定プレイヤーが打てる有効な手リストを返します。
   */
  protected getValidMoves(board: number[][], player: number): Position[] {
    const validMoves: Position[] = [];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (board[y][x] === EMPTY) {
          if (this.isValidMove(board, player, y, x)) {
            validMoves.push({ row: y, col: x });
          }
        }
      }
    }

    return validMoves;
  }

  /**
   * 指定位置が有効な手かどうかを判定します。
   */
  protected isValidMove(board: number[][], player: number, row: number, col: number): boolean {
    return this.getFlippablePieces(board, player, row, col).length > 0;
  }
}
