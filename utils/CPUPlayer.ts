/**
 * CPUプレイヤーの難易度レベル
 */
import * as tf from '@tensorflow/tfjs';

// TensorFlow.jsの初期化
// ブラウザ環境では明示的なバックエンド設定が必要
(async function initializeTensorFlow() {
  try {
    // バックエンドの設定前にweb環境と互換性のあるバージョンを確認
    if (tf.getBackend() === undefined) {
      // CPU バックエンドを明示的にセット（ブラウザでは最も安定）
      await tf.setBackend('cpu');
      await tf.ready(); // TensorFlow.jsの初期化完了を待機
      console.log('TensorFlow.js初期化完了: バックエンド =', tf.getBackend());
    }
  } catch (error) {
    console.error('TensorFlow.jsの初期化に失敗しました:', error);
  }
})();

export enum CPULevel {
  EASY = 'easy',      // 初級: ランダムな手を選ぶ
  MEDIUM = 'medium',  // 中級: 基本的な戦略を使う
  HARD = 'hard',      // 上級: 高度な戦略を使う
  ULTIMATE = 'ultimate' // 最強: 学習済みTensorFlowモデルを使う
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
  private model: tf.LayersModel | null = null;
  private modelLoading: boolean = false;
  private modelLoadAttempts: number = 0;
  private readonly MAX_LOAD_ATTEMPTS = 3;

  /**
   * CPUプレイヤーのコンストラクタ
   * @param level CPU難易度
   */
  constructor(level: CPULevel = CPULevel.MEDIUM) {
    this.level = level;
    if (level === CPULevel.ULTIMATE) {
      // 最強モードでは初期化時にモデルの読み込みを試みる
      this.loadModel();
    }
  }

  /**
   * TensorFlowモデルの読み込み
   * 最強モード用の学習済みモデルをロード
   */
  private async loadModel(): Promise<void> {
    // すでにモデルが読み込まれている、または読み込み中なら何もしない
    if (this.model || this.modelLoading) return;

    // ロード試行回数の上限を超えていたら上級難易度にフォールバック
    if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
      console.warn(`モデルの読み込みを${this.MAX_LOAD_ATTEMPTS}回試行しましたが失敗しました。上級難易度にフォールバックします。`);
      this.level = CPULevel.HARD;
      return;
    }

    try {
      this.modelLoading = true;
      this.modelLoadAttempts++;

      // TensorFlow.jsが初期化されているか確認
      if (tf.getBackend() === undefined) {
        console.log('TensorFlow.jsバックエンドを初期化します');
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('バックエンド設定完了:', tf.getBackend());
      }

      // モデルのロード前にメモリリソースをクリア
      tf.engine().startScope(); // メモリスコープ開始

      // モデルのロード（モデルは/public/models/reversi_model/に配置）
      this.model = await tf.loadLayersModel('/models/reversi_model/model.json');

      // モデルのウォームアップ（最初の推論を行い、内部バッファを準備）
      const dummyInput = tf.zeros([1, 8, 8, 3]);
      const warmupResult = this.model.predict(dummyInput);

      // リソースの解放
      if (Array.isArray(warmupResult)) {
        warmupResult.forEach(tensor => tensor.dispose());
      } else {
        warmupResult.dispose();
      }
      dummyInput.dispose();

      tf.engine().endScope(); // メモリスコープ終了

      console.log('リバーシAIモデルの読み込みとウォームアップに成功しました');
    } catch (error) {
      console.error('リバーシAIモデルの読み込みに失敗しました:', error);

      // メモリリークを防止するためのクリーンアップ
      try {
        tf.engine().endScope();
        tf.engine().disposeVariables();
      } catch (e) {
        console.warn('クリーンアップ中にエラーが発生しました:', e);
      }

      // モデルロードに3回失敗したら上級難易度にフォールバック
      if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
        console.warn(`モデルの読み込みを${this.MAX_LOAD_ATTEMPTS}回試行しましたが失敗しました。上級難易度にフォールバックします。`);
        this.level = CPULevel.HARD;
      } else {
        // 少し待ってから再試行（指数バックオフ）
        const retryDelay = Math.pow(2, this.modelLoadAttempts) * 500;
        console.log(`${retryDelay}ms後にモデルの読み込みを再試行します（${this.modelLoadAttempts}/${this.MAX_LOAD_ATTEMPTS}）`);
        setTimeout(() => {
          this.modelLoading = false;
          this.loadModel();
        }, retryDelay);
      }
    } finally {
      // 再試行する場合は上記のsetTimeoutで処理するため、
      // 再試行しない場合のみここでmodelLoadingをfalseに設定
      if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
        this.modelLoading = false;
      }
    }
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
  async selectMove(board: number[][], currentPlayer: number): Promise<Position | null> {
    // 有効な手の一覧を取得
    const validMoves = this.getValidMoves(board, currentPlayer);
    // 有効な手がない場合はnullを返す
    if (validMoves.length === 0) {
      return null;
    }

    // 最強モードの場合はモデルが未ロードなら待機
    if (this.level === CPULevel.ULTIMATE && !this.model && !this.modelLoading) {
      await this.loadModel();
    }

    // 難易度に応じて手を選択
    switch (this.level) {
      case CPULevel.EASY:
        return this.selectMoveEasy(validMoves);
      case CPULevel.MEDIUM:
        return this.selectMoveMedium(board, currentPlayer, validMoves);
      case CPULevel.HARD:
        return this.selectMoveHard(board, currentPlayer, validMoves);
      case CPULevel.ULTIMATE:
        return await this.selectMoveUltimate(board, currentPlayer, validMoves);
      default:
        return this.selectMoveEasy(validMoves);
    }
  }

  /**
   * モデルへの入力用に盤面データを前処理する
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @returns モデル入力用の4チャンネル配列
   */
  private preprocessBoardForModel(board: number[][], currentPlayer: number): number[][][][] {
    const opponent = currentPlayer === BLACK ? WHITE : BLACK;

    // 3チャンネルの入力データ作成
    // チャンネル0: 自分の石がある位置が1、それ以外は0
    // チャンネル1: 相手の石がある位置が1、それ以外は0
    // チャンネル2: 空きマスがある位置が1、それ以外は0
    const inputData = new Array(1).fill(0).map(() =>
      new Array(8).fill(0).map(() =>
        new Array(8).fill(0).map(() =>
          new Array(3).fill(0),
        ),
      ),
    );

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === currentPlayer) {
          inputData[0][i][j][0] = 1;
        } else if (board[i][j] === opponent) {
          inputData[0][i][j][1] = 1;
        } else if (board[i][j] === EMPTY) {
          inputData[0][i][j][2] = 1;
        }
      }
    }

    return inputData;
  }

  /**
   * 最強難易度の手の選択（学習済みモデルを使用）
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @param validMoves 有効な手の一覧
   * @returns 選択した手の位置
   */
  private async selectMoveUltimate(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    // モデルが読み込めていない場合は上級難易度の戦略を使用
    if (!this.model) {
      console.warn('モデルが読み込まれていないため、上級難易度にフォールバックします');
      return this.selectMoveHard(board, currentPlayer, validMoves);
    }

    try {
      // バックエンドの状態を確認
      if (!tf.getBackend()) {
        console.log('バックエンドが未設定のため設定します');
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('バックエンド設定完了:', tf.getBackend());
      }

      // 入力データの前処理
      const inputData = this.preprocessBoardForModel(board, currentPlayer);

      // テンソルに変換
      const input = tf.tensor4d(inputData);

      try {
        // モデルで予測を実行（Tensorの配列として返される）
        const predictions = this.model.predict(input) as tf.Tensor[];

        // 入力用テンソル解放
        input.dispose();

        // 予測結果をログ出力（デバッグ用）
        console.log('予測テンソル数:', predictions.length);
        if (predictions.length > 0) {
          console.log('最初のテンソル形状:', predictions[0].shape);
        }

        // 最初のテンソルから評価値を取得
        const firstPrediction = predictions[0];

        // テンソルをJavaScriptの配列に変換
        const predictionData = firstPrediction.arraySync();

        // predictionDataは配列の配列なので、最初の要素（0番目）を取得
        // これが各マスの評価値（0-63）とパスの評価値（64）を含む
        const predictionValues = Array.isArray(predictionData) ? predictionData[0] : [];
        console.log('予測値の長さ:', predictionValues.length);

        // 2番目のテンソルから勝率を取得（存在する場合）
        let winRate = null;
        if (predictions.length > 1) {
          const secondPrediction = predictions[1];
          const winRateData = secondPrediction.arraySync();
          if (Array.isArray(winRateData) && winRateData.length > 0) {
            winRate = winRateData[0];
            console.log('現在の勝率予測:', winRate);
          }
        }

        // 使用済みのテンソルを解放
        predictions.forEach(tensor => tensor.dispose());

        // 各有効手の評価値を取得
        const moveScores = validMoves.map(move => {
          // 1次元配列のインデックスに変換
          // 行と列から適切なインデックスを計算（行×8+列）
          const index = move.row * 8 + move.col;

          // インデックスが有効範囲内かチェック
          if (index < 0 || index >= 64 || predictionValues[index] === undefined) {
            console.warn(`無効なインデックス: ${index}, move: (${move.row}, ${move.col})`);
            return { move, score: -Infinity };
          }

          // デバッグ情報
          console.log(`手 (${move.row}, ${move.col}) -> インデックス ${index}, スコア:`, predictionValues[index]);

          return { move, score: predictionValues[index] };
        });

        // 評価値の高い順にソート
        moveScores.sort((a, b) => b.score - a.score);

        // 上位3手の評価値をログ出力（デバッグ用）
        if (moveScores.length > 0) {
          console.log('最善手:', moveScores[0].move, 'スコア:', moveScores[0].score, winRate !== null ? `勝率: ${winRate}` : '');
          if (moveScores.length > 1) {
            console.log('次点:', moveScores[1].move, 'スコア:', moveScores[1].score);
          }
        }

        // 有効な評価値があるか確認
        const validScore = moveScores.find(s => s.score !== -Infinity && !isNaN(s.score));
        if (!validScore) {
          console.warn('有効な評価値がありません。上級難易度にフォールバックします');
          return this.selectMoveHard(board, currentPlayer, validMoves);
        }

        // モデルの評価値に基づく最善手を返す
        return moveScores[0].move;
      } catch (predictError) {
        console.error('モデル予測処理でエラーが発生:', predictError);
        // エラー発生時はリソースを解放
        input.dispose();
        // 上級難易度にフォールバック
        return this.selectMoveHard(board, currentPlayer, validMoves);
      }
    } catch (error) {
      console.error('モデル予測中にエラーが発生しました:', error);

      // メモリリークを防ぐためにTensorFlowのメモリをクリア
      try {
        tf.disposeVariables();
      } catch (e) {
        console.warn('メモリクリア中にエラーが発生:', e);
      }

      // エラー発生時は上級難易度にフォールバック
      return this.selectMoveHard(board, currentPlayer, validMoves);
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
