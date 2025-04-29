import type { Position } from '../GameLogic/constants';
import type { BaseCPUPlayer } from './BaseCPUPlayer';
import { EasyCPUPlayer } from './EasyCPUPlayer';
import { MediumCPUPlayer } from './MediumCPUPlayer';
import { HardCPUPlayer } from './HardCPUPlayer';
import { UltimateCPUPlayer } from './UltimateCPUPlayer';
import * as tf from '@tensorflow/tfjs';

// TensorFlow.jsの初期化（初回のみ）
(async function initializeTensorFlow() {
  try {
    if (tf.getBackend() === undefined) {
      await tf.setBackend('cpu');
      await tf.ready();
    }
    console.log('TensorFlow.js 初期化完了: バックエンド=', tf.getBackend());
  } catch (error) {
    console.error('TensorFlow.jsの初期化に失敗しました:', error);
  }
})();

/**
 * CPUプレイヤーの難易度レベル
 */
export enum CPULevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  ULTIMATE = 'ultimate',
}

/**
 * CPUプレイヤーのファクトリークラス
 */
export class CPUPlayer {
  private player: BaseCPUPlayer;

  /**
   * コンストラクター
   */
  constructor(level: CPULevel = CPULevel.MEDIUM) {
    this.player = CPUPlayer.createPlayerByLevel(level);
  }

  /**
   * 難易度に応じたCPUプレイヤーインスタンスを生成します。
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
   * 設定されている難易度を返します。
   */
  getLevel(): CPULevel {
    return this.player.getLevel();
  }

  /**
   * 難易度を設定します。
   */
  setLevel(level: CPULevel): void {
    this.player = CPUPlayer.createPlayerByLevel(level);
  }

  /**
   * 現在の盤面状況から次の手を決定します。
   */
  async selectMove(board: number[][], currentPlayer: number): Promise<Position | null> {
    return await this.player.selectMove(board, currentPlayer);
  }
}
