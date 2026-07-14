import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SegmentedControl } from './SegmentedControl';
import { LinkIcon } from '@/components/icon/LinkIcon';
import { TextIcon } from '@/components/icon/TextIcon';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { value: 'url', label: '공고 URL', icon: <LinkIcon width={18} height={18} /> },
      { value: 'text', label: '공고 텍스트', icon: <TextIcon width={18} height={18} /> },
    ],
    value: 'url',
    onChange: () => {},
  },
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};
