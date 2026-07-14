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
    items: [
      { value: 'summary', label: '요약 공고' },
      { value: 'original', label: '원본 공고' },
    ],
    value: 'summary',
    onChange: () => {},
  },
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value);
    return <ToggleGroup {...args} value={value} onChange={setValue} />;
  },
};
