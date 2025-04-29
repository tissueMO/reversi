import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModal from './BaseModal.vue';

describe('ベースモーダル', () => {
  it('モーダルが表示される', () => {
    const wrapper = mount(BaseModal, { props: { isOpen: true } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
  });

  it('モーダルが非表示になる', () => {
    const wrapper = mount(BaseModal, { props: { isOpen: false } });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });
});
