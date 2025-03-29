import type { CPULevel, Position } from './types';
import { EMPTY, BLACK, WHITE } from './types';

/**
 * CPU戦略の基底クラス
 * 難易度に応じた具体的な戦略はサブクラスで実装する
 */
export abstract class BaseCPUPlayer {
  protected level: CPULevel;

  /**
   * CPUプレイヤーのコンストラクタ
   * @param level CPU難易度
   */
  constructor(level: CPULevel) {
    this.level = level;
  }

  /**
   * 設定されている難易度の取得
   */
  getLevel(): CPULevel {
    return this.level;
  }

  /**
   * 現在の盤面状況から次の手を決定する
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー（1:黒、2:白）
   * @returns 次の手の位置、有効な手がない場合はnull
   */
  async selectMove(board: number[][], currentPlayer: number): Promise<Position | null> {
    // 有効な手の一覧を取得
    const validMoves = this.getValidMoves(board, currentPlayer);

    // 有効な手がない場合はnullを返す
    if (validMoves.length === 0) {
      return null;
    }

    // 子クラスで実装された戦略を使って手を選択
    return await this.selectMoveByStrategy(board, currentPlayer, validMoves);
  }

  /**
   * 各難易度ごとの手の選択戦略
   * サブクラスで実装する
   */
  protected abstract selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position>;

  /**
   * 石を置いた後の盤面を取得
   * @param board 元の盤面
   * @param player プレイヤー
   * @param move 置く位置
   * @returns 石を置いた後の盤面
   */
  protected getResultBoard(board: number[][], player: number, move: Position): number[][] {
    // 盤面のコピーを作成
    const newBoard = board.map(row => [...row]);

    // 石を置く
    newBoard[move.row][move.col] = player;

    // ひっくり返す石の情報を取得
    const flippablePieces = this.getFlippablePieces(board, player, move.row, move.col);

    // 石をひっくり返す
    flippablePieces.forEach(pos => {
      newBoard[pos.row][pos.col] = player;
    });

    return newBoard;
  }

  /**
   * 指定位置に石を置いた場合にひっくり返せる石のリストを取得
   * @param board 盤面
   * @param player プレイヤー
   * @param row 行
   * @param col 列
   * @returns ひっくり返せる石の位置のリスト
   */
  protected getFlippablePieces(board: number[][], player: number, row: number, col: number): Position[] {
    // すでに石がある場合は空のリストを返す
    if (board[row][col] !== EMPTY) {
      return [];
    }

    const opponent = player === BLACK ? WHITE : BLACK;
    const flippablePieces: Position[] = [];

    // 8方向のベクトル定義
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];

    // 各方向について調査
    for (const [dx, dy] of directions) {
      let x = row + dx;
      let y = col + dy;
      const tempFlips: Position[] = [];

      // 盤面内かつ相手の石がある限り進む
      while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === opponent) {
        tempFlips.push({ row: x, col: y });
        x += dx;
        y += dy;
      }

      // 1つ以上の石を挟み、最後に自分の石があれば反転できる
      if (tempFlips.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && board[x][y] === player) {
        flippablePieces.push(...tempFlips);
      }
    }

    return flippablePieces;
  }

  /**
   * 指定プレイヤーが打てる有効な手のリストを取得
   * @param board 盤面
   * @param player プレイヤー
   * @returns 有効な手の位置のリスト
   */
  protected getValidMoves(board: number[][], player: number): Position[] {
    const validMoves: Position[] = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === EMPTY && this.isValidMove(board, player, i, j)) {
          validMoves.push({ row: i, col: j });
        }
      }
    }

    return validMoves;
  }

  /**
   * 指定位置が有効な手かどうかを判定
   * @param board 盤面
   * @param player プレイヤー
   * @param row 行
   * @param col 列
   * @returns 有効な手かどうか
   */
  protected isValidMove(board: number[][], player: number, row: number, col: number): boolean {
    return this.getFlippablePieces(board, player, row, col).length > 0;
  }
}
