import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'assistive'],
    },
    size: {
      control: 'select',
      options: ['lg', 'md', 'sm'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: '분석하기',
  },
};

export const Assistive: Story = {
  args: {
    variant: 'assistive',
    size: 'lg',
    children: '분석하기',
  },
};
