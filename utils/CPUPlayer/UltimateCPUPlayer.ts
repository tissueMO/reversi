import * as tf from '@tensorflow/tfjs';
import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from '../GameLogic/constants';
import { CPULevel } from './index';
import { BLACK, WHITE, EMPTY } from '../GameLogic/constants';
import { HardCPUPlayer } from './HardCPUPlayer';

/**
 * 最強CPUプレイヤークラス
 * ※学習済みAIモデルによる最適手を選択する戦略を取る
 */
export class UltimateCPUPlayer extends BaseCPUPlayer {
  private model: tf.LayersModel | null = null;
  private modelLoading: boolean = false;
  private modelLoadAttempts: number = 0;
  private modelLoadFailed: boolean = false;
  private readonly MAX_LOAD_ATTEMPTS = 3;
  private readonly MODEL_PATH = './models/reversi_model/model.json';

  /**
   * コンストラクター
   */
  constructor() {
    super(CPULevel.ULTIMATE);
    this.loadModel();
  }

  /**
   * モデルが利用可能かどうかを返します。
   */
  public isModelReady(): boolean {
    return this.model !== null;
  }

  /**
   * モデルのロードが失敗したかどうかを返します。
   */
  public hasModelLoadFailed(): boolean {
    return this.modelLoadFailed;
  }

  /**
   * モデルが現在ロード中かどうかを返します。
   */
  public isModelLoading(): boolean {
    return this.modelLoading;
  }

  /**
   * {@inheritdoc}
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    // ※モデルが利用できない場合は上級CPUにフォールバック
    if (!this.model) {
      const hardPlayer = new HardCPUPlayer();
      return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
    }

    try {
      if (!tf.getBackend()) {
        await tf.setBackend('cpu');
        await tf.ready();
      }

      const input = tf.tensor4d(this.preprocessBoardForModel(board, currentPlayer));

      try {
        const predictions = this.model.predict(input) as tf.Tensor[];
        const firstPrediction = predictions[0];
        const predictionData = firstPrediction.arraySync();
        const predictionValues = Array.isArray(predictionData) ? predictionData[0] : [];

        for (const tensor of predictions) {
          tensor.dispose();
        }

        const moveScores = validMoves
          .map((move) => {
            const index = move.row * 8 + move.col;
            if (index < 0 || index >= 64 || predictionValues[index] === undefined) {
              return { move, score: -Infinity };
            } else {
              return { move, score: predictionValues[index] };
            }
          })
          .toSorted((a, b) => b.score - a.score);

        const validScore = moveScores.find(s => s.score !== -Infinity && !isNaN(s.score));
        if (!validScore) {
          const hardPlayer = new HardCPUPlayer();
          return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
        }

        return moveScores[0].move;

      } finally {
        input.dispose();
      }

    } catch {
      try {
        tf.disposeVariables();
      } catch {
        // 破棄に失敗しても何もしない
      }

      // モデルから推論結果を得られなかった場合は上級CPUにフォールバック
      const hardPlayer = new HardCPUPlayer();
      return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
    }
  }

  /**
   * AIモデルのロードを試みます。
   * ※ロード失敗時は指数バックオフで一定回数まで再試行します。
   */
  private async loadModel(): Promise<void> {
    if (this.model || this.modelLoading) {
      return;
    }
    if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
      this.modelLoadFailed = true;
      return;
    }

    try {
      if (!tf.getBackend()) {
        await tf.setBackend('cpu');
        await tf.ready();
      }

      this.modelLoading = true;
      this.modelLoadAttempts++;

      tf.engine().startScope();
      this.model = await tf.loadLayersModel(this.MODEL_PATH);

      // ダミー入力でモデルをウォームアップ
      const dummyInput = tf.zeros([1, 8, 8, 3]);
      const warmupResult = this.model.predict(dummyInput);
      if (Array.isArray(warmupResult)) {
        for (const tensor of warmupResult) {
          tensor.dispose();
        }
      } else {
        warmupResult.dispose();
      }

      dummyInput.dispose();
      tf.engine().endScope();
      this.modelLoadFailed = false;

    } catch {
      try {
        tf.engine().endScope();
        tf.engine().disposeVariables();
      } catch {
        // 破棄に失敗しても何もしない
      }

      if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
        this.modelLoadFailed = true;
      } else {
        setTimeout(() => {
          this.modelLoading = false;
          this.loadModel();
        }, Math.pow(2, this.modelLoadAttempts) * 500);
      }

    } finally {
      if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
        this.modelLoading = false;
      }
    }
  }

  /**
   * 盤面データをAIモデル入力形式に変換します。
   */
  private preprocessBoardForModel(board: number[][], currentPlayer: number): number[][][][] {
    const opponent = currentPlayer === BLACK ? WHITE : BLACK;
    const inputData = new Array(1).fill(0).map(() =>
      new Array(8).fill(0).map(() =>
        new Array(8).fill(0).map(() =>
          new Array(3).fill(0),
        ),
      ),
    );

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (board[y][x] === currentPlayer) {
          inputData[0][y][x][0] = 1;
        } else if (board[y][x] === opponent) {
          inputData[0][y][x][1] = 1;
        } else if (board[y][x] === EMPTY) {
          inputData[0][y][x][2] = 1;
        }
      }
    }

    return inputData;
  }
}
