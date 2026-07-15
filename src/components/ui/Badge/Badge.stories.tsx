import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge, PriorityBadge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['confirmed', 'needsImprovement', 'missing'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: { variant: 'confirmed', children: '확인됨' },
};

export const NeedsImprovement: Story = {
  args: { variant: 'needsImprovement', children: '보강 필요' },
};

export const Missing: Story = {
  args: { variant: 'missing', children: '없음' },
};

export const AllVariants: Story = {
  args: { variant: 'confirmed', children: '확인됨' },
  render: () => (
    <div className="flex gap-2">
      <Badge variant="confirmed">확인됨</Badge>
      <Badge variant="needsImprovement">보강 필요</Badge>
      <Badge variant="missing">없음</Badge>
    </div>
  ),
};

export const PriorityHigh: StoryObj = {
  render: () => <PriorityBadge priority="high" />,
};

export const PriorityAll: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <PriorityBadge priority="high" />
      <PriorityBadge priority="medium" />
      <PriorityBadge priority="low" />
    </div>
  ),
};
