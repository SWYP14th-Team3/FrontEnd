import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './Input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'error', 'disabled'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '430px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    state: 'default',
    placeholder: '공고 URL을 입력해주세요.',
  },
};

export const WithValue: Story = {
  args: {
    state: 'default',
    defaultValue: 'https://www.wanted.co.kr/wd/12345',
  },
};

export const WithLabel: Story = {
  args: {
    state: 'default',
    label: '공고 URL',
    placeholder: '공고 URL을 입력해주세요.',
    helperText: '채용공고 링크를 붙여넣어 주세요.',
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    defaultValue: 'invalid-url',
  },
};

export const Disabled: Story = {
  args: {
    state: 'disabled',
    placeholder: '공고 URL을 입력해주세요.',
  },
};
