import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Feedback } from './Feedback';

const meta = {
  title: 'Common/Feedback',
  component: Feedback,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Feedback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCallback: Story = {
  args: {
    onFeedback: (type) => alert(`피드백: ${type}`),
  },
};
