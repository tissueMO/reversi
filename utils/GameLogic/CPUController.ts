import type { CPULevel } from '../CPUPlayer';
import { CPUPlayer } from '../CPUPlayer';
import type { ReversiGameLogic } from './ReversiGameLogic';
import type { GameMode, Position } from './constants';
import { BLACK, WHITE } from './constants';

/**
 * CPUプレイヤー関連の処理を一元管理するコントローラークラス
 */
export class CPUController {
  /** メイン（1P側）のCPUプレイヤー */
  private _cpuPlayer: CPUPlayer | null = null;

  /** 2P側のCPUプレイヤー（CPU vs CPU モード用） */
  private _cpu2Player: CPUPlayer | null = null;

  /** 現在のゲームモード */
  private _gameMode: GameMode = 'twoPlayers';

  /** ゲームロジックへの参照 */
  private _gameLogic: ReversiGameLogic;

  /**
   * コンストラクタ
   * @param gameLogic ゲームロジックのインスタンス
   */
  constructor(gameLogic: ReversiGameLogic) {
    this._gameLogic = gameLogic;
  }

  /**
   * ゲームモードと設定を更新
   * @param gameMode ゲームモード
   * @param cpuLevel 1P側CPUのレベル
   * @param cpu2Level 2P側CPUのレベル
   */
  public updateSettings(gameMode: GameMode, cpuLevel: CPULevel, cpu2Level: CPULevel): void {
    this._gameMode = gameMode;

    // プレイヤーモードに合わせてCPUプレイヤーを設定
    if (gameMode === 'playerVsCPU') {
      this._cpuPlayer = new CPUPlayer(cpuLevel);
      this._cpu2Player = null;
    }
    else if (gameMode === 'cpuVsCpu') {
      this._cpuPlayer = new CPUPlayer(cpuLevel);
      this._cpu2Player = new CPUPlayer(cpu2Level);
    }
    else {
      this._cpuPlayer = null;
      this._cpu2Player = null;
    }
  }

  /**
   * 現在のゲームモードを取得
   */
  public get gameMode(): GameMode {
    return this._gameMode;
  }

  /**
   * プレイヤーの色を基準に、現在のターンがCPUのターンかどうかを判定
   * @param playerColor プレイヤーの石の色
   * @param currentPlayer 現在の手番プレイヤー
   */
  public isOpponentTurn(playerColor: number, currentPlayer: number): boolean {
    // CPU対CPUモードの場合、常にCPUがプレイするのでユーザー操作は不要
    if (this._gameMode === 'cpuVsCpu') {
      return true;
    }

    // プレイヤー対CPUモードの場合、現在の手番がプレイヤーの色と一致しない場合はCPUのターン
    if (this._gameMode === 'playerVsCPU') {
      return currentPlayer !== playerColor;
    }

    return false;
  }

  /**
   * CPUの手を決定して返す
   * @param currentPlayer 現在の手番プレイヤー
   * @returns CPUが選択した手の位置。または有効な手がない場合はnull
   */
  public async decideCPUMove(currentPlayer: number): Promise<Position | null> {
    // 対応するCPUプレイヤーを選択
    const activeCPU = this.getActiveCPU(currentPlayer);
    if (!activeCPU) return null;

    // CPUの手を決定する思考時間を設定
    const thinkingTime = this._gameMode === 'cpuVsCpu' ? 800 : 1000;
    await new Promise(resolve => setTimeout(resolve, thinkingTime));

    // CPUの手を取得
    return await activeCPU.selectMove(this._gameLogic.getBoard(), currentPlayer);
  }

  /**
   * 現在のプレイヤーに対応するCPUインスタンスを取得
   * @param currentPlayer 現在のプレイヤー
   */
  private getActiveCPU(currentPlayer: number): CPUPlayer | null {
    if (this._gameMode === 'playerVsCPU') {
      // プレイヤー対CPUモードの場合は常に_cpuPlayerを返す
      return this._cpuPlayer;
    }
    else if (this._gameMode === 'cpuVsCpu') {
      // CPU対CPUモードの場合、黒番なら_cpuPlayer、白番なら_cpu2Playerを返す
      return currentPlayer === BLACK ? this._cpuPlayer : this._cpu2Player;
    }

    return null;
  }

  /**
   * CPU対CPUモードで有効かどうかを返す
   */
  public isCPUvsCPUMode(): boolean {
    return this._gameMode === 'cpuVsCpu' && this._cpuPlayer !== null && this._cpu2Player !== null;
  }

  /**
   * プレイヤー対CPUモードで有効かどうかを返す
   */
  public isPlayerVsCPUMode(): boolean {
    return this._gameMode === 'playerVsCPU' && this._cpuPlayer !== null;
  }
}
