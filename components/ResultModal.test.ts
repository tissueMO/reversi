import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultModal from './ResultModal.vue';

describe('結果モーダル', () => {
  it('プレイヤー対プレイヤー: 勝敗・石数・アイコンが表示される', () => {
    const wrapper = mount(ResultModal, {
      props: {
        isOpen: true,
        player1Count: 34,
        player2Count: 30,
        player1Color: 1,
        player2Color: 2,
        gameMode: 'twoPlayers',
      },
    });
    expect(wrapper.text()).toContain('プレイヤー1の勝ち');
    expect(wrapper.text()).toContain('プレイヤー1: 34');
    expect(wrapper.text()).toContain('プレイヤー2: 30');
    expect(wrapper.find('.black-icon').exists()).toBe(true);
    expect(wrapper.find('.white-icon').exists()).toBe(true);
  });

  it('プレイヤー対CPU: 勝敗・石数・アイコンが表示される', () => {
    const wrapper = mount(ResultModal, {
      props: {
        isOpen: true,
        player1Count: 20,
        player2Count: 44,
        player1Color: 2,
        player2Color: 1,
        gameMode: 'playerVsCPU',
      },
    });
    expect(wrapper.text()).toContain('CPUの勝ち');
    expect(wrapper.text()).toContain('あなた: 20');
    expect(wrapper.text()).toContain('CPU: 44');
    expect(wrapper.find('.white-icon').exists()).toBe(true);
    expect(wrapper.find('.black-icon').exists()).toBe(true);
  });

  it('CPU対CPU: 勝敗・石数・アイコンが表示される', () => {
    const wrapper = mount(ResultModal, {
      props: {
        isOpen: true,
        player1Count: 40,
        player2Count: 24,
        player1Color: 1,
        player2Color: 2,
        gameMode: 'cpuVsCpu',
      },
    });
    expect(wrapper.text()).toContain('CPU.1の勝ち');
    expect(wrapper.text()).toContain('CPU.1: 40');
    expect(wrapper.text()).toContain('CPU.2: 24');
    expect(wrapper.find('.black-icon').exists()).toBe(true);
    expect(wrapper.find('.white-icon').exists()).toBe(true);
  });

  it('「次のゲームへ」ボタンでイベントが発火する', async () => {
    const wrapper = mount(ResultModal, {
      props: {
        isOpen: true,
        player1Count: 32,
        player2Count: 32,
        player1Color: 1,
        player2Color: 2,
        gameMode: 'twoPlayers',
      },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('next-game')).toBeTruthy();
  });

  it('モーダル外クリックでは閉じない', async () => {
    const wrapper = mount(ResultModal, {
      props: {
        isOpen: true,
        player1Count: 20,
        player2Count: 44,
        player1Color: 2,
        player2Color: 1,
        gameMode: 'playerVsCPU',
      },
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();
  });
});
