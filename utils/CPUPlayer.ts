/**
 * CPUプレイヤーの難易度レベル
 */
export enum CPULevel {
  EASY = 'easy',    // 初級: ランダムな手を選ぶ
  MEDIUM = 'medium', // 中級: 基本的な戦略を使う
  HARD = 'hard'     // 上級: 高度な戦略を使う
}

/**
 * マスの状態を表す定数
 */
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

/**
 * 盤面上の位置を表す型
 */
export type Position = {
  row: number;
  col: number;
};

/**
 * CPUプレイヤーのクラス
 * 難易度に応じた手を選択する
 */
export class CPUPlayer {
  private level: CPULevel;

  /**
   * CPUプレイヤーのコンストラクタ
   * @param level CPU難易度
   */
  constructor(level: CPULevel = CPULevel.MEDIUM) {
    this.level = level;
  }

  /**
   * 設定されている難易度の取得
   */
  getLevel(): CPULevel {
    return this.level;
  }

  /**
   * 難易度の設定
   * @param level 設定する難易度
   */
  setLevel(level: CPULevel): void {
    this.level = level;
  }

  /**
   * 現在の盤面状況から次の手を決定する
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー（1:黒、2:白）
   * @returns 次の手の位置、有効な手がない場合はnull
   */
  selectMove(board: number[][], currentPlayer: number): Position | null {
    // 有効な手の一覧を取得
    const validMoves = this.getValidMoves(board, currentPlayer);

    // 有効な手がない場合はnullを返す
    if (validMoves.length === 0) {
      return null;
    }

    // 難易度に応じて手を選択
    switch (this.level) {
      case CPULevel.EASY:
        return this.selectMoveEasy(validMoves);
      case CPULevel.MEDIUM:
        return this.selectMoveMedium(board, currentPlayer, validMoves);
      case CPULevel.HARD:
        return this.selectMoveHard(board, currentPlayer, validMoves);
      default:
        return this.selectMoveEasy(validMoves);
    }
  }

  /**
   * 初級難易度の手の選択（ランダム）
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  private selectMoveEasy(validMoves: Position[]): Position {
    // 有効な手からランダムに選択
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  /**
   * 中級難易度の手の選択
   * 基本戦略: 角を優先し、角の隣は避ける、それ以外は獲得石数が多い手を選ぶ
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  private selectMoveMedium(board: number[][], currentPlayer: number, validMoves: Position[]): Position {
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

  /**
   * 上級難易度の手の選択
   * 高度な戦略: 角を最優先し、端の列を重視、角の隣は避ける、評価関数を使った盤面評価
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  private selectMoveHard(board: number[][], currentPlayer: number, validMoves: Position[]): Position {
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
        const opponent = currentPlayer === BLACK ? WHITE : BLACK;
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

  /**
   * 石を置いた後の盤面を取得
   * @param board 元の盤面
   * @param player プレイヤー
   * @param move 置く位置
   * @returns 石を置いた後の盤面
   */
  private getResultBoard(board: number[][], player: number, move: Position): number[][] {
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
  private getFlippablePieces(board: number[][], player: number, row: number, col: number): Position[] {
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
  private getValidMoves(board: number[][], player: number): Position[] {
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
  private isValidMove(board: number[][], player: number, row: number, col: number): boolean {
    return this.getFlippablePieces(board, player, row, col).length > 0;
  }
}
