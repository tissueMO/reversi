import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GameSettings from './GameSettings.vue';

describe('設定モーダル', () => {
  it('対戦モード・CPU強さ選択UIが表示される', () => {
    const wrapper = mount(GameSettings, { props: { isOpen: true } });
    expect(wrapper.text()).toContain('対戦モード');
    expect(wrapper.text()).toMatch(/CPU|プレイヤー/);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('「ゲームを開始」ボタンでイベントが発火する', async () => {
    const wrapper = mount(GameSettings, { props: { isOpen: true } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('new-game')).toBeTruthy();
  });

  it('モーダル外クリックでは閉じない', async () => {
    const wrapper = mount(GameSettings, { props: { isOpen: true } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();
  });
});
