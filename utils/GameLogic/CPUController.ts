import type { CPULevel } from '../CPUPlayer';
import { CPUPlayer } from '../CPUPlayer';
import type { ReversiGameLogic } from './ReversiGameLogic';
import type { GameMode, Position } from './constants';
import { BLACK, WHITE } from './constants';

/**
 * CPU制御クラス
 * 対戦モード・CPU手番判定・思考制御を担う
 */
export class CPUController {
  private cpuPlayer: CPUPlayer | null = null;
  private cpu2Player: CPUPlayer | null = null;
  private gameModeValue: GameMode = 'twoPlayers';
  private gameLogic: ReversiGameLogic;

  /**
   * コンストラクター
   */
  constructor(gameLogic: ReversiGameLogic) {
    this.gameLogic = gameLogic;
  }

  /**
   * ゲームモード・CPU設定を更新します。
   */
  public updateSettings(
    gameMode: GameMode,
    cpuLevel: CPULevel,
    cpu2Level: CPULevel,
  ): void {
    this.gameModeValue = gameMode;
    if (gameMode === 'playerVsCPU') {
      this.cpuPlayer = new CPUPlayer(cpuLevel);
      this.cpu2Player = null;
    } else if (gameMode === 'cpuVsCpu') {
      this.cpuPlayer = new CPUPlayer(cpuLevel);
      this.cpu2Player = new CPUPlayer(cpu2Level);
    } else {
      this.cpuPlayer = null;
      this.cpu2Player = null;
    }
  }

  /**
   * 現在のゲームモードを返します。
   */
  public get gameMode(): GameMode {
    return this.gameModeValue;
  }

  /**
   * 現在のターンがCPUのターンかどうかを返します。
   */
  public isOpponentTurn(playerColor: number, currentPlayer: number): boolean {
    if (this.gameModeValue === 'cpuVsCpu') {
      return true;
    } else if (this.gameModeValue === 'playerVsCPU') {
      return currentPlayer !== playerColor;
    } else {
      return false;
    }
  }

  /**
   * CPUの手を決定します。
   */
  public async decideCPUMove(currentPlayer: number): Promise<Position | null> {
    const activeCPU = this.getActiveCPU(currentPlayer);
    if (!activeCPU) {
      return null;
    }
    const thinkingTime = this.gameModeValue === 'cpuVsCpu' ? 800 : 1000;
    await new Promise((resolve) => setTimeout(resolve, thinkingTime));
    return await activeCPU.selectMove(this.gameLogic.getBoard(), currentPlayer);
  }

  /**
   * 現在のプレイヤーに対応するCPUインスタンスを返します。
   */
  private getActiveCPU(currentPlayer: number): CPUPlayer | null {
    if (this.gameModeValue === 'playerVsCPU') {
      return this.cpuPlayer;
    } else if (this.gameModeValue === 'cpuVsCpu' && currentPlayer === BLACK) {
        return this.cpuPlayer;
    } else if (this.gameModeValue === 'cpuVsCpu' && currentPlayer === WHITE) {
      return this.cpu2Player;
    } else {
      return null;
    }
  }

  /**
   * CPU対CPUモードかどうかを返します。
   */
  public isCPUvsCPUMode(): boolean {
    return (
      this.gameModeValue === 'cpuVsCpu' &&
      this.cpuPlayer !== null &&
      this.cpu2Player !== null
    );
  }

  /**
   * プレイヤー対CPUモードかどうかを返します。
   */
  public isPlayerVsCPUMode(): boolean {
    return this.gameModeValue === 'playerVsCPU' && this.cpuPlayer !== null;
  }
}
