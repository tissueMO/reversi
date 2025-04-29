import { describe, it, expect } from 'vitest';
import { CPUController } from './CPUController';
import { CPULevel } from '../CPUPlayer';

describe('CPUController', () => {
  it('CPUの手を取得できる', async () => {
    const board = Array(8).fill(0).map(() => Array(8).fill(0));
    board[3][3] = 2; board[3][4] = 1; board[4][3] = 1; board[4][4] = 2;

    const dummyGameLogic = {
      getBoard: () => board,
    } as any;

    const controller = new CPUController(dummyGameLogic);
    controller.updateSettings('playerVsCPU', CPULevel.EASY, CPULevel.EASY);

    const move = await controller.decideCPUMove(1);
    expect(move).not.toBeNull();
  });
});
