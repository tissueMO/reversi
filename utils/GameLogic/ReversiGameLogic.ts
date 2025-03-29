import type { GameStatus, Position } from './constants';
import { BLACK, WHITE, EMPTY, DIRECTIONS } from './constants';

/**
 * リバーシゲームのコアロジックを管理するクラス
 * 盤面の状態管理、ゲームルール適用、有効な手の判定などを担当
 */
export class ReversiGameLogic {
  /** 盤面の状態 (0:空, 1:黒, 2:白) */
  private _board: number[][];

  /** 現在の手番プレイヤー */
  private _currentPlayer: number;

  /** ゲームの状態 */
  private _gameStatus: GameStatus;

  /**
   * コンストラクタ：ゲームを初期状態に設定
   */
  constructor() {
    this._board = Array(8).fill(0).map(() => Array(8).fill(EMPTY));
    this._currentPlayer = BLACK; // 黒から開始
    this._gameStatus = 'playing';
    this.initializeBoard();
  }

  /**
   * 盤面を初期状態に設定
   * リバーシの初期配置（中央に黒白が交互に配置される）
   */
  public initializeBoard(): void {
    // 盤面をクリア
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        this._board[i][j] = EMPTY;
      }
    }

    // 初期配置
    this._board[3][3] = WHITE;
    this._board[3][4] = BLACK;
    this._board[4][3] = BLACK;
    this._board[4][4] = WHITE;

    // ゲーム開始時は常に黒から
    this._currentPlayer = BLACK;
    this._gameStatus = 'playing';
  }

  /**
   * 現在の盤面の状態を返す（ディープコピー）
   */
  public getBoard(): number[][] {
    return this._board.map(row => [...row]);
  }

  /**
   * 現在の手番プレイヤーを取得
   */
  public getCurrentPlayer(): number {
    return this._currentPlayer;
  }

  /**
   * 現在のゲーム状態を取得
   */
  public getGameStatus(): GameStatus {
    return this._gameStatus;
  }

  /**
   * 指定の位置に石を置けるかどうかを判定
   * @param row 行
   * @param col 列
   * @param player 置こうとするプレイヤー（指定がなければ現在の手番プレイヤー）
   * @returns 石を置けるかどうか
   */
  public canPlaceAt(row: number, col: number, player: number = this._currentPlayer): boolean {
    // すでに石があるマスには置けない
    if (this._board[row][col] !== EMPTY) {
      return false;
    }

    return this.getFlippablePieces(row, col, player).length > 0;
  }

  /**
   * 石を置いた際にひっくり返せる石の位置リストを取得
   * @param row 行
   * @param col 列
   * @param player 置こうとするプレイヤー（指定がなければ現在の手番プレイヤー）
   * @returns ひっくり返せる石の位置リスト
   */
  public getFlippablePieces(row: number, col: number, player: number = this._currentPlayer): Position[] {
    // すでに石があるマスは無視
    if (this._board[row][col] !== EMPTY) {
      return [];
    }

    const opponent = player === BLACK ? WHITE : BLACK;
    const flippablePieces: Position[] = [];

    // 8方向について石をひっくり返せるかチェック
    for (const [dx, dy] of DIRECTIONS) {
      let x = row + dx;
      let y = col + dy;
      const tempFlips: Position[] = [];

      // 盤面内かつ相手の石がある限り進む
      while (x >= 0 && x < 8 && y >= 0 && y < 8 && this._board[x][y] === opponent) {
        tempFlips.push({ row: x, col: y });
        x += dx;
        y += dy;
      }

      // 1つ以上の石を挟み、最後に自分の石があれば反転できる
      if (tempFlips.length > 0 && x >= 0 && x < 8 && y >= 0 && y < 8 && this._board[x][y] === player) {
        flippablePieces.push(...tempFlips);
      }
    }

    return flippablePieces;
  }

  /**
   * 指定プレイヤーが打てる有効な手のリストを取得
   * @param player プレイヤー（指定がなければ現在の手番プレイヤー）
   * @returns 有効な手の位置のリスト
   */
  public getValidMoves(player: number = this._currentPlayer): Position[] {
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
   * 指定プレイヤーが有効な手を持っているかを判定
   * @param player プレイヤー（指定がなければ現在の手番プレイヤー）
   * @returns 有効な手があるかどうか
   */
  public hasValidMove(player: number = this._currentPlayer): boolean {
    return this.getValidMoves(player).length > 0;
  }

  /**
   * 石を置いて盤面を更新する
   * @param row 行
   * @param col 列
   * @returns ひっくり返した石の位置リスト
   */
  public placeStone(row: number, col: number): Position[] {
    // 有効な手でなければ何もしない
    if (!this.canPlaceAt(row, col)) {
      return [];
    }

    // ひっくり返す石の位置を取得
    const flippablePieces = this.getFlippablePieces(row, col);

    // 石を置く
    this._board[row][col] = this._currentPlayer;

    // 石をひっくり返す
    for (const { row, col } of flippablePieces) {
      this._board[row][col] = this._currentPlayer;
    }

    return flippablePieces;
  }

  /**
   * 次のターンに進む
   * @returns 次のプレイヤーが有効な手を持つかどうか
   */
  public nextTurn(): boolean {
    // 相手プレイヤーに手番を切り替え
    this._currentPlayer = this._currentPlayer === BLACK ? WHITE : BLACK;

    // 次のプレイヤーが有効な手を持つかどうか
    if (!this.hasValidMove()) {
      // 相手も置けなければゲーム終了
      if (!this.hasValidMove(this._currentPlayer === BLACK ? WHITE : BLACK)) {
        this._gameStatus = 'ended';
        return false;
      }

      // 自分が置けなければ、再度手番を切り替え
      this._currentPlayer = this._currentPlayer === BLACK ? WHITE : BLACK;
    }

    return true;
  }

  /**
   * ゲームが終了しているかを判定
   * @returns ゲームが終了しているかどうか
   */
  public isGameOver(): boolean {
    return this._gameStatus === 'ended';
  }

  /**
   * ゲームを終了状態に設定
   */
  public endGame(): void {
    this._gameStatus = 'ended';
  }

  /**
   * 黒石の数を取得
   */
  public getBlackCount(): number {
    return this._board.flat().filter(cell => cell === BLACK).length;
  }

  /**
   * 白石の数を取得
   */
  public getWhiteCount(): number {
    return this._board.flat().filter(cell => cell === WHITE).length;
  }

  /**
   * 指定プレイヤーの石の数を取得
   * @param player プレイヤー
   */
  public getStoneCount(player: number): number {
    return this._board.flat().filter(cell => cell === player).length;
  }

  /**
   * 盤面を直接設定（テストやデバッグ用）
   */
  public setBoard(newBoard: number[][]): void {
    if (newBoard.length !== 8 || newBoard[0].length !== 8) {
      throw new Error('盤面は8x8でなければなりません');
    }
    this._board = newBoard.map(row => [...row]);
  }

  /**
   * 手番プレイヤーを直接設定（テストやデバッグ用）
   */
  public setCurrentPlayer(player: number): void {
    if (player !== BLACK && player !== WHITE) {
      throw new Error('プレイヤーは1(黒)または2(白)でなければなりません');
    }
    this._currentPlayer = player;
  }

  /**
   * 終盤の盤面状態を生成する（デバッグ用）
   * @param emptyCount 残す空きマスの数
   */
  public generateEndGamePosition(emptyCount: number): void {
    // 盤面をほぼ埋め尽くした状態にする
    const totalCells = 64; // 8x8の盤面
    const blackCount = Math.floor((totalCells - emptyCount) / 2);
    const whiteCount = totalCells - emptyCount - blackCount;

    // 一度盤面をクリア
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        this._board[i][j] = EMPTY;
      }
    }

    // まずemptyCountの数だけ空きマスの位置を決める
    const emptyCells: [number, number][] = [];
    while (emptyCells.length < emptyCount) {
      const row = Math.floor(Math.random() * 8);
      const col = Math.floor(Math.random() * 8);
      // 既に選ばれていない位置を追加
      if (!emptyCells.some(([r, c]) => r === row && c === col)) {
        emptyCells.push([row, col]);
      }
    }

    // 残りのマスに黒石と白石を配置
    let remainingBlack = blackCount;
    let remainingWhite = whiteCount;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        // 空きマスに指定された位置はスキップ
        if (emptyCells.some(([r, c]) => r === i && c === j)) {
          continue;
        }

        // すべての石を配置し終えたら終了
        if (remainingBlack === 0 && remainingWhite === 0) {
          break;
        }

        // ランダムに石を配置
        const rand = Math.random();

        if (rand < 0.5 && remainingBlack > 0) {
          this._board[i][j] = BLACK;
          remainingBlack--;
        } else if (remainingWhite > 0) {
          this._board[i][j] = WHITE;
          remainingWhite--;
        } else if (remainingBlack > 0) {
          this._board[i][j] = BLACK;
          remainingBlack--;
        }
      }
    }

    // 有効な手があるプレイヤーを探して手番を設定
    if (this.hasValidMove(BLACK)) {
      this._currentPlayer = BLACK;
    } else if (this.hasValidMove(WHITE)) {
      this._currentPlayer = WHITE;
    } else {
      // 両プレイヤーとも置けない場合はゲーム終了
      this._gameStatus = 'ended';
    }
  }
}
