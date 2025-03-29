import * as tf from '@tensorflow/tfjs';
import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position} from './types';
import { CPULevel, BLACK, WHITE, EMPTY } from './types';
import { HardCPUPlayer } from './HardCPUPlayer';

/**
 * 最強難易度のCPUプレイヤー
 * 学習済みのTensorFlowモデルを使用して手を選択する
 */
export class UltimateCPUPlayer extends BaseCPUPlayer {
  private model: tf.LayersModel | null = null;
  private modelLoading: boolean = false;
  private modelLoadAttempts: number = 0;
  private modelLoadFailed: boolean = false;
  private readonly MAX_LOAD_ATTEMPTS = 3;

  constructor() {
    super(CPULevel.ULTIMATE);
    // 初期化時にモデルの読み込みを試みる
    this.loadModel();
  }

  /**
   * モデルが読み込まれ、使用可能かどうかを返す
   * @returns モデルが読み込まれているかどうか
   */
  public isModelReady(): boolean {
    return this.model !== null;
  }

  /**
   * モデルの読み込みが完全に失敗したかどうかを返す
   * @returns モデルの読み込みが失敗したかどうか
   */
  public hasModelLoadFailed(): boolean {
    return this.modelLoadFailed;
  }

  /**
   * 現在のモデル読み込み処理の状態を返す
   * @returns モデルが読み込み中かどうか
   */
  public isModelLoading(): boolean {
    return this.modelLoading;
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
      console.warn(`モデルの読み込みを${this.MAX_LOAD_ATTEMPTS}回試行しましたが失敗しました。上級難易度の戦略にフォールバックします。`);
      this.modelLoadFailed = true;
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
      this.modelLoadFailed = false;
    } catch (error) {
      console.error('リバーシAIモデルの読み込みに失敗しました:', error);

      // メモリリークを防止するためのクリーンアップ
      try {
        tf.engine().endScope();
        tf.engine().disposeVariables();
      } catch (e) {
        console.warn('クリーンアップ中にエラーが発生しました:', e);
      }

      // モデルロードに3回失敗したら終了
      if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
        console.warn(`モデルの読み込みを${this.MAX_LOAD_ATTEMPTS}回試行しましたが失敗しました。上級難易度の戦略にフォールバックします。`);
        this.modelLoadFailed = true;
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
   * モデルへの入力用に盤面データを前処理する
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー
   * @returns モデル入力用の3チャンネル配列
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
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    // モデルが読み込めていない場合は上級難易度の戦略を使用
    if (!this.model) {
      console.warn('モデルが読み込まれていないため、上級難易度の戦略にフォールバックします');
      const hardPlayer = new HardCPUPlayer();
      return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
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
          console.warn('有効な評価値がありません。上級難易度の戦略にフォールバックします');
          const hardPlayer = new HardCPUPlayer();
          return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
        }

        // モデルの評価値に基づく最善手を返す
        return moveScores[0].move;
      } catch (predictError) {
        console.error('モデル予測処理でエラーが発生:', predictError);
        // エラー発生時はリソースを解放
        input.dispose();
        // 上級難易度にフォールバック
        const hardPlayer = new HardCPUPlayer();
        return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
      }
    } catch (error) {
      console.error('モデル予測中にエラーが発生しました:', error);

      // メモリリークを防ぐためにTensorFlowのメモリをクリア
      try {
        tf.disposeVariables();
      } catch (e) {
        console.warn('メモリクリア中にエラーが発生:', e);
      }

      // エラー発生時は上級難易度の戦略にフォールバック
      const hardPlayer = new HardCPUPlayer();
      return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
    }
  }
}
