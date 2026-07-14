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
    value: 'url',
    onChange: () => {},
  },
  render: function DefaultStory() {
    const [value, setValue] = useState('url');
    return (
      <SegmentedControl value={value} onChange={setValue}>
        <SegmentedControl.Item value="url">
          <LinkIcon width={18} height={18} className="align-middle" />
          공고 URL
        </SegmentedControl.Item>
        <SegmentedControl.Item value="text">
          <TextIcon width={18} height={18} className="align-middle" />
          공고 텍스트
        </SegmentedControl.Item>
      </SegmentedControl>
    );
  },
};
