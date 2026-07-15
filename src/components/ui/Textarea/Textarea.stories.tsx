import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
    maxLength: {
      control: 'number',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '430px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    state: 'default',
    placeholder: '공고 텍스트를 입력해주세요.',
    rows: 5,
  },
};

export const WithCounter: Story = {
  args: {
    state: 'default',
    placeholder: '공고 텍스트를 입력해주세요.',
    maxLength: 6000,
    rows: 5,
  },
};

export const WithValue: Story = {
  args: {
    state: 'default',
    defaultValue: '프론트엔드 개발자를 모집합니다. React, TypeScript 경험 필수...',
    maxLength: 6000,
    rows: 5,
  },
};

export const WithLabel: Story = {
  args: {
    state: 'default',
    label: '공고 텍스트',
    placeholder: '공고 텍스트를 입력해주세요.',
    maxLength: 6000,
    rows: 5,
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    defaultValue: '텍스트 내용...',
    maxLength: 6000,
    rows: 5,
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
    placeholder: '공고 텍스트를 입력해주세요.',
    rows: 5,
  },
};
