import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CountBadge } from './CountBadge';

const meta = {
  title: 'UI/CountBadge',
  component: CountBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['confirmed', 'needsImprovement', 'missing'],
    },
    count: { control: 'number' },
  },
} satisfies Meta<typeof CountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: { variant: 'confirmed', count: 5, children: '확인됨' },
};

export const NeedsImprovement: Story = {
  args: { variant: 'needsImprovement', count: 5, children: '보강 필요' },
};

export const Missing: Story = {
  args: { variant: 'missing', count: 5, children: '없음' },
};

export const AllVariants: Story = {
  args: { variant: 'confirmed', count: 5, children: '확인됨' },
  render: () => (
    <div className="flex gap-3">
      <CountBadge variant="confirmed" count={5}>확인됨</CountBadge>
      <CountBadge variant="needsImprovement" count={3}>보강 필요</CountBadge>
      <CountBadge variant="missing" count={2}>없음</CountBadge>
    </div>
  ),
};
