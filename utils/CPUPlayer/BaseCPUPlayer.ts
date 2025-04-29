import type { CPULevel, Position } from './types';
import { EMPTY, BLACK, WHITE } from './types';

/**
 * CPU戦略基底クラス
 * 難易度ごとの戦略実装の共通基盤
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
   * 有効な手がない場合はnullを返します。
   */
  async selectMove(
    board: number[][],
    currentPlayer: number,
  ): Promise<Position | null> {
    const validMoves = this.getValidMoves(board, currentPlayer);
    if (validMoves.length === 0) {
      return null;
    }
    return await this.selectMoveByStrategy(board, currentPlayer, validMoves);
  }

  /**
   * 難易度ごとの手選択戦略を実装します。
   */
  protected abstract selectMoveByStrategy(
    board: number[][],
    currentPlayer: number,
    validMoves: Position[],
  ): Promise<Position>;

  /**
   * 石を置いた後の盤面を返します。
   */
  protected getResultBoard(
    board: number[][],
    player: number,
    move: Position,
  ): number[][] {
    // 盤面コピーによる副作用防止
    const newBoard = board.map((row) => [...row]);
    newBoard[move.row][move.col] = player;
    const flippablePieces = this.getFlippablePieces(
      board,
      player,
      move.row,
      move.col,
    );
    for (const pos of flippablePieces) {
      newBoard[pos.row][pos.col] = player;
    }
    return newBoard;
  }

  /**
   * 指定位置に石を置いた場合にひっくり返せる石リストを返します。
   */
  protected getFlippablePieces(
    board: number[][],
    player: number,
    row: number,
    col: number,
  ): Position[] {
    if (board[row][col] !== EMPTY) {
      return [];
    }
    const opponent = player === BLACK ? WHITE : BLACK;
    const flippablePieces: Position[] = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    for (const [dx, dy] of directions) {
      let x = row + dx;
      let y = col + dy;
      const tempFlips: Position[] = [];
      while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
        tempFlips.push({ row: x, col: y });
        x += dx;
        y += dy;
      }
      if (
        tempFlips.length > 0 &&
        x >= 0 &&
        x < 8 &&
        y >= 0 &&
        y < 8 &&
        board[x][y] === player
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
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === EMPTY) {
          if (this.isValidMove(board, player, i, j)) {
            validMoves.push({ row: i, col: j });
          }
        }
      }
    }
    return validMoves;
  }

  /**
   * 指定位置が有効な手かどうかを判定します。
   */
  protected isValidMove(
    board: number[][],
    player: number,
    row: number,
    col: number,
  ): boolean {
    return this.getFlippablePieces(board, player, row, col).length > 0;
  }
}
