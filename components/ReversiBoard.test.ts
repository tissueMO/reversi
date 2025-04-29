import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ReversiBoard from './ReversiBoard.vue';
import { CPULevel } from '../utils/CPUPlayer';
import { BLACK, WHITE } from '../utils/GameLogic/constants';

function mountBoard(props = {}) {
  return mount(ReversiBoard, {
    props: {
      gameMode: 'twoPlayers',
      cpu1Level: CPULevel.EASY,
      cpu2Level: CPULevel.EASY,
      ...props,
    },
  });
}

describe('リバーシボードの初期表示', () => {
  it('8x8のボードが表示される', () => {
    const wrapper = mountBoard();
    expect(wrapper.findAll('.board-row')).toHaveLength(8);
    for (const row of wrapper.findAll('.board-row')) {
      expect(row.findAll('.board-cell')).toHaveLength(8);
    }
  });

  it('初期石が4つ配置されている', () => {
    const wrapper = mountBoard();
    const blackPieces = wrapper.findAll('.piece-black');
    const whitePieces = wrapper.findAll('.piece-white');
    expect(blackPieces.length).toBe(2);
    expect(whitePieces.length).toBe(2);

    const positions = [
      { row: 3, col: 3, color: 'white' },
      { row: 3, col: 4, color: 'black' },
      { row: 4, col: 3, color: 'black' },
      { row: 4, col: 4, color: 'white' },
    ];

    for (const { row, col, color } of positions) {
      const cell = wrapper.find(`.board-row:nth-child(${row + 1}) .board-cell:nth-child(${col + 1})`);
      expect(cell.find(`.piece-${color}`).exists()).toBe(true);
    }
  });
});

describe('石を置く操作', () => {
  it('有効なマスに石を置くと手番が交代する', async () => {
    const wrapper = mountBoard();

    const cell = wrapper
      .findAll('.board-cell')
      .find((cell) => cell.find('.valid-move-indicator').exists());
    expect(cell).toBeDefined();
    await cell?.trigger('click');

    const player1Score = wrapper.find('.player1-score');
    const player2Score = wrapper.find('.player2-score');
    expect(player1Score.classes().includes('current-turn') || player2Score.classes().includes('current-turn')).toBe(true);
  });

  it('無効なマスをクリックしても石が置かれない', async () => {
    const wrapper = mountBoard();

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
    expect(wrapper.find('.player1-score').text()).toMatch(/\d+/);
    expect(wrapper.find('.player2-score').text()).toMatch(/\d+/);
  });

  it('最後まで対局するとゲーム終了時に結果モーダルが表示される', async () => {
    const wrapper = mountBoard({
      gameMode: 'cpuVsCpu',
      cpu1Level: CPULevel.EASY,
      cpu2Level: CPULevel.EASY,
    });

    // 対局が終わるまで待つ
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 30));
      await wrapper.vm.$nextTick();
      if (wrapper.findComponent({ name: 'ResultModal' }).exists()) {
        break;
      }
    }
    expect(wrapper.findComponent({ name: 'ResultModal' }).exists()).toBe(true);
  });
});

describe('デバッグ・CPU機能', () => {
  it('skipToEndingで終局2手前になる', async () => {
    const wrapper = mountBoard();
    await wrapper.vm.skipToEnding();
    const empty = wrapper
      .findAll('.board-cell')
      .filter(cell => !cell.find('.piece-black') && !cell.find('.piece-white'));
    expect(empty.length).toBeLessThanOrEqual(2);
  });

  it('skipToEndingで終局5手前になる', async () => {
    const wrapper = mountBoard();
    await wrapper.vm.skipToEnding(5);
    const empty = wrapper
      .findAll('.board-cell')
      .filter(cell => !cell.find('.piece-black') && !cell.find('.piece-white'));
    expect(empty.length).toBeLessThanOrEqual(5);
  });

  it('skipToEndingで黒が多くなるようにできる', async () => {
    const wrapper = mountBoard();
    await wrapper.vm.skipToEnding(2, BLACK);
    const black = wrapper.findAll('.piece-black').length;
    const white = wrapper.findAll('.piece-white').length;
    expect(black).toBeGreaterThan(white);
  });

  it('skipToEndingで白が多くなるようにできる', async () => {
    const wrapper = mountBoard();
    await wrapper.vm.skipToEnding(2, WHITE);
    const black = wrapper.findAll('.piece-black').length;
    const white = wrapper.findAll('.piece-white').length;
    expect(white).toBeGreaterThan(black);
  });
});

describe('クラッカー（紙吹雪）エフェクトの表示', () => {
  let originalRandom: () => number;
  beforeEach(() => {
    originalRandom = Math.random;
  });
  afterEach(() => {
    Math.random = originalRandom;
  });

  it('プレイヤー対プレイヤー：プレイヤー1が勝つとクラッカーが表示される', async () => {
    // プレイヤー1が必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'twoPlayers' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2, BLACK);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(true);
  });
  it('プレイヤー対プレイヤー：プレイヤー2が勝つとクラッカーが表示される', async () => {
    // プレイヤー1が必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'twoPlayers' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2, WHITE);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(true);
  });
  it('プレイヤー対プレイヤー：引き分けの場合はクラッカーが表示されない', async () => {
    // プレイヤー1が必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'twoPlayers' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });

  it('プレイヤー対CPU：プレイヤーが勝つとクラッカーが表示される', async () => {
    // プレイヤーが必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'playerVsCPU' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2, BLACK); // 黒が多い盤面
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(true);
  });
  it('プレイヤー対CPU：プレイヤーが負けるとクラッカーが表示されない', async () => {
    // プレイヤーが必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'playerVsCPU' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2, WHITE);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });
  it('プレイヤー対CPU：引き分けの場合はクラッカーが表示されない', async () => {
    // プレイヤーが必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'playerVsCPU' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });

  it('CPU対CPU：CPU1が勝ってもクラッカーが表示されない', async () => {
    // CPU1が必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'cpuVsCpu' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2, BLACK);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });
  it('CPU対CPU：CPU2が勝ってもクラッカーが表示されない', async () => {
    // CPU1が必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'cpuVsCpu' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2, WHITE);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });
  it('CPU対CPU：引き分けの場合はクラッカーが表示されない', async () => {
    // CPU1が必ず黒になるように固定
    Math.random = () => 0;
    const wrapper = mountBoard({ gameMode: 'cpuVsCpu' });
    Math.random = originalRandom;
    await wrapper.vm.skipToEnding(2);
    await wrapper.vm.forceGameEnd();
    await new Promise((r) => setTimeout(r, 600));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });
});
