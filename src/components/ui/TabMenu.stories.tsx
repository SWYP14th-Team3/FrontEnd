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
    value: 'analyze',
    onChange: () => {},
  },
  render: function DefaultStory() {
    const [value, setValue] = useState('analyze');
    return (
      <TabMenu value={value} onChange={setValue}>
        <TabMenu.Item value="analyze">분석하기</TabMenu.Item>
        <TabMenu.Item value="history">분석 기록</TabMenu.Item>
      </TabMenu>
    );
  },
};
