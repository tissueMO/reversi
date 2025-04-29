import * as tf from '@tensorflow/tfjs';
import { BaseCPUPlayer } from './BaseCPUPlayer';
import type { Position } from './types';
import { CPULevel, BLACK, WHITE, EMPTY  } from './types';
import { HardCPUPlayer } from './HardCPUPlayer';

/**
 * 最強CPUプレイヤークラス
 * 学習済みAIモデルによる最適手選択戦略の実装
 */
export class UltimateCPUPlayer extends BaseCPUPlayer {
  private model: tf.LayersModel | null = null;
  private modelLoading: boolean = false;
  private modelLoadAttempts: number = 0;
  private modelLoadFailed: boolean = false;
  private readonly MAX_LOAD_ATTEMPTS = 3;

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
   * AIモデルのロードを試みます。
   * ロード失敗時は指数バックオフで再試行し、上限回数でフォールバックします。
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
      this.modelLoading = true;
      this.modelLoadAttempts++;
      if (tf.getBackend() === undefined) {
        await tf.setBackend('cpu');
        await tf.ready();
      }
      tf.engine().startScope();
      this.model = await tf.loadLayersModel('/models/reversi_model/model.json');
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
    } catch (error) {
      try {
        tf.engine().endScope();
        tf.engine().disposeVariables();
      } catch (_) {}
      if (this.modelLoadAttempts >= this.MAX_LOAD_ATTEMPTS) {
        this.modelLoadFailed = true;
      } else {
        const retryDelay = Math.pow(2, this.modelLoadAttempts) * 500;
        setTimeout(() => {
          this.modelLoading = false;
          this.loadModel();
        }, retryDelay);
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
   * AIモデルまたは上級戦略で最適手を選択します。
   * モデル利用不可時は上級戦略にフォールバックします。
   */
  protected async selectMoveByStrategy(board: number[][], currentPlayer: number, validMoves: Position[]): Promise<Position> {
    if (!this.model) {
      const hardPlayer = new HardCPUPlayer();
      return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
    }
    try {
      if (!tf.getBackend()) {
        await tf.setBackend('cpu');
        await tf.ready();
      }
      const inputData = this.preprocessBoardForModel(board, currentPlayer);
      const input = tf.tensor4d(inputData);
      try {
        const predictions = this.model.predict(input) as tf.Tensor[];
        input.dispose();
        const firstPrediction = predictions[0];
        const predictionData = firstPrediction.arraySync();
        const predictionValues = Array.isArray(predictionData) ? predictionData[0] : [];
        for (const tensor of predictions) {
          tensor.dispose();
        }
        const moveScores = validMoves.map(move => {
          const index = move.row * 8 + move.col;
          if (index < 0 || index >= 64 || predictionValues[index] === undefined) {
            return { move, score: -Infinity };
          }
          return { move, score: predictionValues[index] };
        });
        moveScores.sort((a, b) => b.score - a.score);
        const validScore = moveScores.find(s => s.score !== -Infinity && !isNaN(s.score));
        if (!validScore) {
          const hardPlayer = new HardCPUPlayer();
          return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
        }
        return moveScores[0].move;
      } catch (_) {
        input.dispose();
        const hardPlayer = new HardCPUPlayer();
        return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
      }
    } catch (_) {
      try {
        tf.disposeVariables();
      } catch (_) {}
      const hardPlayer = new HardCPUPlayer();
      return hardPlayer.selectMoveUsingHardStrategy(board, currentPlayer, validMoves);
    }
  }
}
