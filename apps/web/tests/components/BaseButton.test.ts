import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '~/components/base/BaseButton.vue';

describe('BaseButton', () => {
  it('renders button with label', () => {
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Click me',
      },
    });

    expect(wrapper.text()).toContain('Click me');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('applies correct variant class', () => {
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Test',
        variant: 'primary',
      },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('bg-accent');
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Test',
      },
    });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(BaseButton, {
      props: {
        label: 'Test',
        disabled: true,
      },
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });
});
