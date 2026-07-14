import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ToggleGroup } from './ToggleGroup';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 'summary',
    onChange: () => {},
  },
  render: function DefaultStory() {
    const [value, setValue] = useState('summary');
    return (
      <ToggleGroup value={value} onChange={setValue}>
        <ToggleGroup.Item value="summary">요약 공고</ToggleGroup.Item>
        <ToggleGroup.Item value="original">원본 공고</ToggleGroup.Item>
      </ToggleGroup>
    );
  },
};
