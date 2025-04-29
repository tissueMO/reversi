import type { CPULevel } from '../CPUPlayer';
import { CPUPlayer } from '../CPUPlayer';
import type { ReversiGameLogic } from './ReversiGameLogic';
import type { GameMode, Position } from './constants';
import { BLACK, WHITE } from './constants';

/**
 * CPU制御クラス
 */
export class CPUController {
  private cpuPlayer1: CPUPlayer | null = null;
  private cpuPlayer2: CPUPlayer | null = null;
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
  public updateSettings(gameMode: GameMode, cpu1Level: CPULevel, cpu2Level: CPULevel): void {
    this.gameModeValue = gameMode;

    if (gameMode === 'playerVsCPU') {
      this.cpuPlayer1 = new CPUPlayer(cpu1Level);
      this.cpuPlayer2 = null;
    } else if (gameMode === 'cpuVsCpu') {
      this.cpuPlayer1 = new CPUPlayer(cpu1Level);
      this.cpuPlayer2 = new CPUPlayer(cpu2Level);
    } else {
      this.cpuPlayer1 = null;
      this.cpuPlayer2 = null;
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
    if (this.gameModeValue === 'playerVsCPU') {
      return currentPlayer !== playerColor;
    } else if (this.gameModeValue === 'cpuVsCpu') {
      return true;
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
      return this.cpuPlayer1;
    } else if (this.gameModeValue === 'cpuVsCpu' && currentPlayer === BLACK) {
      return this.cpuPlayer1;
    } else if (this.gameModeValue === 'cpuVsCpu' && currentPlayer === WHITE) {
      return this.cpuPlayer2;
    } else {
      return null;
    }
  }

  /**
   * CPU対CPUモードかどうかを返します。
   */
  public isCPUvsCPUMode(): boolean {
    return this.gameModeValue === 'cpuVsCpu' && this.cpuPlayer1 !== null && this.cpuPlayer2 !== null;
  }

  /**
   * プレイヤー対CPUモードかどうかを返します。
   */
  public isPlayerVsCPUMode(): boolean {
    return this.gameModeValue === 'playerVsCPU' && this.cpuPlayer1 !== null;
  }
}
