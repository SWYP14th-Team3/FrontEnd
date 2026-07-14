import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TabMenu } from './TabMenu';

const meta = {
  title: 'UI/TabMenu',
  component: TabMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TabMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { value: 'analyze', label: '분석하기' },
      { value: 'history', label: '분석 기록' },
    ],
    value: 'analyze',
    onChange: () => {},
  },
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value);
    return <TabMenu {...args} value={value} onChange={setValue} />;
  },
};
