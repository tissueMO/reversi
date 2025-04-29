import type { GameStatus, Position } from './constants';
import { BLACK, WHITE, EMPTY, DIRECTIONS } from './constants';

/**
 * ゲームロジック管理クラス
 * 盤面状態・ルール適用・有効手判定を担う
 */
export class ReversiGameLogic {
  private board: number[][];
  private currentPlayer: number;
  private gameStatus: GameStatus;

  /**
   * コンストラクター
   */
  constructor() {
    this.board = Array(8).fill(0).map(() => Array(8).fill(EMPTY));
    this.currentPlayer = BLACK;
    this.gameStatus = 'playing';
    this.initializeBoard();
  }

  /**
   * 盤面を初期状態に設定します。
   */
  public initializeBoard(): void {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        this.board[i][j] = EMPTY;
      }
    }
    this.board[3][3] = WHITE;
    this.board[3][4] = BLACK;
    this.board[4][3] = BLACK;
    this.board[4][4] = WHITE;
    this.currentPlayer = BLACK;
    this.gameStatus = 'playing';
  }

  /**
   * 現在の盤面を返します。
   */
  public getBoard(): number[][] {
    return this.board.map(row => [...row]);
  }

  /**
   * 現在の手番プレイヤーを返します。
   */
  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  /**
   * 現在のゲーム状態を返します。
   */
  public getGameStatus(): GameStatus {
    return this.gameStatus;
  }

  /**
   * 指定位置に石を置けるかどうかを返します。
   */
  public canPlaceAt(row: number, col: number, player: number = this.currentPlayer): boolean {
    if (this.board[row][col] !== EMPTY) {
      return false;
    }
    return this.getFlippablePieces(row, col, player).length > 0;
  }

  /**
   * 指定位置に石を置いた場合にひっくり返せる石リストを返します。
   */
  public getFlippablePieces(row: number, col: number, player: number = this.currentPlayer): Position[] {
    if (this.board[row][col] !== EMPTY) {
      return [];
    }
    const opponent = player === BLACK ? WHITE : BLACK;
    const flippablePieces: Position[] = [];
    for (const [dx, dy] of DIRECTIONS) {
      let x = row + dx;
      let y = col + dy;
      const tempFlips: Position[] = [];
      while (x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === opponent) {
        tempFlips.push({ row: x, col: y });
        x += dx;
        y += dy;
      }
      if (tempFlips.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === player) {
        flippablePieces.push(...tempFlips);
      }
    }
    return flippablePieces;
  }

  /**
   * 指定プレイヤーが打てる有効な手リストを返します。
   */
  public getValidMoves(player: number = this.currentPlayer): Position[] {
    const validMoves: Position[] = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (this.canPlaceAt(i, j, player)) {
          validMoves.push({ row: i, col: j });
        }
      }
    }
    return validMoves;
  }

  /**
   * 指定プレイヤーが有効な手を持つかどうかを返します。
   */
  public hasValidMove(player: number = this.currentPlayer): boolean {
    return this.getValidMoves(player).length > 0;
  }

  /**
   * 指定位置に石を置き盤面を更新します。
   */
  public placeStone(row: number, col: number): Position[] {
    if (!this.canPlaceAt(row, col)) {
      return [];
    }
    const flippablePieces = this.getFlippablePieces(row, col);
    this.board[row][col] = this.currentPlayer;
    for (const { row: r, col: c } of flippablePieces) {
      this.board[r][c] = this.currentPlayer;
    }
    return flippablePieces;
  }

  /**
   * 次のターンに進めます。
   */
  public nextTurn(): boolean {
    this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
    if (!this.hasValidMove()) {
      if (!this.hasValidMove(this.currentPlayer === BLACK ? WHITE : BLACK)) {
        this.gameStatus = 'ended';
        return false;
      }
      this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
    }
    return true;
  }

  /**
   * ゲーム終了かどうかを返します。
   */
  public isGameOver(): boolean {
    return this.gameStatus === 'ended';
  }

  /**
   * ゲームを終了状態にします。
   */
  public endGame(): void {
    this.gameStatus = 'ended';
  }

  /**
   * 黒石の数を返します。
   */
  public getBlackCount(): number {
    return this.board.flat().filter(cell => cell === BLACK).length;
  }

  /**
   * 白石の数を返します。
   */
  public getWhiteCount(): number {
    return this.board.flat().filter(cell => cell === WHITE).length;
  }

  /**
   * 指定プレイヤーの石数を返します。
   */
  public getStoneCount(player: number): number {
    return this.board.flat().filter(cell => cell === player).length;
  }

  /**
   * 盤面を直接設定します。
   */
  public setBoard(newBoard: number[][]): void {
    if (newBoard.length !== 8 || newBoard[0].length !== 8) {
      throw new Error('盤面は8x8でなければなりません');
    }
    this.board = newBoard.map(row => [...row]);
  }

  /**
   * 手番プレイヤーを直接設定します。
   */
  public setCurrentPlayer(player: number): void {
    if (player !== BLACK && player !== WHITE) {
      throw new Error('プレイヤーは1(黒)または2(白)でなければなりません');
    }
    this.currentPlayer = player;
  }

  /**
   * 終盤盤面を生成します。
   * @param emptyCount 空きマス数
   * @param player 石数が多くなるプレイヤー（1:黒, 2:白、省略時は均等）
   */
  public generateEndGamePosition(emptyCount: number, player?: number): void {
    const totalCells = 64;
    let blackCount: number;
    let whiteCount: number;
    const stones = totalCells - emptyCount;
    if (player === BLACK) {
      blackCount = Math.floor(stones / 2) + 1;
      whiteCount = stones - blackCount;
    } else if (player === WHITE) {
      whiteCount = Math.floor(stones / 2) + 1;
      blackCount = stones - whiteCount;
    } else {
      blackCount = Math.floor(stones / 2);
      whiteCount = stones - blackCount;
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        this.board[i][j] = EMPTY;
      }
    }
    const emptyCells: [number, number][] = [];
    while (emptyCells.length < emptyCount) {
      const row = Math.floor(Math.random() * 8);
      const col = Math.floor(Math.random() * 8);
      if (!emptyCells.some(([r, c]) => r === row && c === col)) {
        emptyCells.push([row, col]);
      }
    }
    let remainingBlack = blackCount;
    let remainingWhite = whiteCount;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (emptyCells.some(([r, c]) => r === i && c === j)) {
          continue;
        }
        if (remainingBlack === 0 && remainingWhite === 0) {
          break;
        }
        const rand = Math.random();
        if (rand < 0.5 && remainingBlack > 0) {
          this.board[i][j] = BLACK;
          remainingBlack--;
        } else if (remainingWhite > 0) {
          this.board[i][j] = WHITE;
          remainingWhite--;
        } else if (remainingBlack > 0) {
          this.board[i][j] = BLACK;
          remainingBlack--;
        }
      }
    }
    if (this.hasValidMove(BLACK)) {
      this.currentPlayer = BLACK;
    } else if (this.hasValidMove(WHITE)) {
      this.currentPlayer = WHITE;
    } else {
      this.gameStatus = 'ended';
    }
  }
}
