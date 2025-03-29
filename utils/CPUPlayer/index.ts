import { CPULevel } from './types';
import type { Position } from './types';
import type { BaseCPUPlayer } from './BaseCPUPlayer';
import { EasyCPUPlayer } from './EasyCPUPlayer';
import { MediumCPUPlayer } from './MediumCPUPlayer';
import { HardCPUPlayer } from './HardCPUPlayer';
import { UltimateCPUPlayer } from './UltimateCPUPlayer';

// TensorFlow.jsの初期化（初回のみ）
import * as tf from '@tensorflow/tfjs';

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

/**
 * CPUプレイヤーのファクトリークラス
 * 適切な難易度のCPUプレイヤーインスタンスを生成する
 */
export class CPUPlayer {
  private player: BaseCPUPlayer;

  /**
   * CPUプレイヤーのコンストラクタ
   * @param level CPU難易度
   */
  constructor(level: CPULevel = CPULevel.MEDIUM) {
    // 難易度に応じた適切なCPUプレイヤーを生成
    this.player = CPUPlayer.createPlayerByLevel(level);
  }

  /**
   * 難易度に応じたCPUプレイヤーインスタンスを生成する
   */
  private static createPlayerByLevel(level: CPULevel): BaseCPUPlayer {
    switch (level) {
      case CPULevel.EASY:
        return new EasyCPUPlayer();
      case CPULevel.MEDIUM:
        return new MediumCPUPlayer();
      case CPULevel.HARD:
        return new HardCPUPlayer();
      case CPULevel.ULTIMATE:
        return new UltimateCPUPlayer();
      default:
        return new MediumCPUPlayer();
    }
  }

  /**
   * 設定されている難易度の取得
   */
  getLevel(): CPULevel {
    return this.player.getLevel();
  }

  /**
   * 難易度の設定
   * @param level 設定する難易度
   */
  setLevel(level: CPULevel): void {
    // 新しい難易度のCPUプレイヤーを生成
    this.player = CPUPlayer.createPlayerByLevel(level);
  }

  /**
   * 現在の盤面状況から次の手を決定する
   * @param board 現在の盤面
   * @param currentPlayer 現在のプレイヤー（1:黒、2:白）
   * @returns 次の手の位置、有効な手がない場合はnull
   */
  async selectMove(board: number[][], currentPlayer: number): Promise<Position | null> {
    // 内部のプレイヤーインスタンスに処理を委譲
    return await this.player.selectMove(board, currentPlayer);
  }
}

// 型定義をエクスポート
export { CPULevel, Position };
