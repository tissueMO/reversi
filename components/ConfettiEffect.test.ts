import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfettiEffect from './ConfettiEffect.vue';

describe('クラッカーエフェクト', () => {
  it('エフェクトが描画される', () => {
    const wrapper = mount(ConfettiEffect, { props: { isActive: true } });
    expect(wrapper.find('.confetti-container').exists()).toBe(true);
  });

  it('エフェクトが描画されない', () => {
    const wrapper = mount(ConfettiEffect, { props: { isActive: false } });
    expect(wrapper.find('.confetti-container').exists()).toBe(false);
  });
});
