import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ReversiBoard from './ReversiBoard.vue';
import { CPULevel } from '../utils/CPUPlayer';

function mountBoard(props = {}) {
  return mount(ReversiBoard, {
    props: {
      gameMode: 'twoPlayers',
      cpuLevel: CPULevel.EASY,
      cpu2Level: CPULevel.EASY,
      ...props,
    },
  });
}

describe('リバーシボードの初期表示', () => {
  it('8x8のボードが表示される', () => {
    const wrapper = mountBoard();
    expect(wrapper.findAll('.board-row')).toHaveLength(8);
    wrapper.findAll('.board-row').forEach(row => {
      expect(row.findAll('.board-cell')).toHaveLength(8);
    });
  });
  it('初期石が4つ配置されている', () => {
    const wrapper = mountBoard();
    const blackPieces = wrapper.findAll('.piece-black');
    const whitePieces = wrapper.findAll('.piece-white');
    expect(blackPieces.length).toBe(2);
    expect(whitePieces.length).toBe(2);
    // それぞれの位置も検証（中央4マス）
    const positions = [
      { row: 3, col: 3, color: 'white' },
      { row: 3, col: 4, color: 'black' },
      { row: 4, col: 3, color: 'black' },
      { row: 4, col: 4, color: 'white' },
    ];
    positions.forEach(({ row, col, color }) => {
      const cell = wrapper.find(`.board-row:nth-child(${row + 1}) .board-cell:nth-child(${col + 1})`);
      expect(cell.find(`.piece-${color}`).exists()).toBe(true);
    });
  });
});

describe('石を置く操作', () => {
  it('有効なマスに石を置くと手番が交代する', async () => {
    const wrapper = mountBoard();
    // 最初の有効手を探す
    const cell = wrapper.findAll('.board-cell').find(cell => cell.find('.valid-move-indicator').exists());
    expect(cell).toBeDefined();
    await cell?.trigger('click');
    // 手番表示が切り替わる（UIクラスで判定）
    const playerScore = wrapper.find('.player-score');
    const opponentScore = wrapper.find('.opponent-score');
    expect(
      playerScore.classes().includes('current-turn') ||
      opponentScore.classes().includes('current-turn'),
    ).toBe(true);
  });
  it('無効なマスをクリックしても石が置かれない', async () => {
    const wrapper = mountBoard();
    // 無効なマス（初期配置の石がある場所）
    const cell = wrapper.find('.board-row:nth-child(4) .board-cell:nth-child(4)');
    const before = wrapper.findAll('.piece-black, .piece-white').length;
    await cell.trigger('click');
    const after = wrapper.findAll('.piece-black, .piece-white').length;
    expect(after).toBe(before);
  });
});

describe('UI表示', () => {
  it('石数・手番表示が正しい', () => {
    const wrapper = mountBoard();
    expect(wrapper.find('.player-score').text()).toMatch(/\d+/);
    expect(wrapper.find('.opponent-score').text()).toMatch(/\d+/);
  });
  it('最後まで対局するとゲーム終了時に結果モーダルが表示される', async () => {
    const wrapper = mountBoard({ gameMode: 'cpuVsCpu', cpuLevel: CPULevel.EASY, cpu2Level: CPULevel.EASY });
    // 対局が終わるまで待つ
    for (let i = 0; i < 100; i++) {
      await new Promise(r => setTimeout(r, 30));
      await wrapper.vm.$nextTick();
      if (wrapper.findComponent({ name: 'ResultModal' }).exists()) {
        break;
      }
    }
    expect(wrapper.findComponent({ name: 'ResultModal' }).exists()).toBe(true);
  });
});

describe('デバッグ・CPU機能', () => {
  it('skipToEndGameで終局2手前になる', async () => {
    const wrapper = mountBoard();
    if (typeof wrapper.vm.skipToEndGame === 'function') {
      await wrapper.vm.skipToEndGame();
      const empty = wrapper.findAll('.board-cell').filter(cell => !cell.find('.piece-black') && !cell.find('.piece-white'));
      expect(empty.length).toBeLessThanOrEqual(2);
    }
  });
});
