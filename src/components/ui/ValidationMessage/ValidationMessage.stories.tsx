import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ValidationMessage } from './ValidationMessage';

const meta = {
  title: 'UI/ValidationMessage',
  component: ValidationMessage,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['error'],
    },
  },
} satisfies Meta<typeof ValidationMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FileSizeError: Story = {
  args: {
    variant: 'error',
    children: '10MB 이하 파일만 업로드 가능합니다.',
  },
};

export const FileTypeError: Story = {
  args: {
    variant: 'error',
    children: 'PDF 파일만 업로드 가능합니다.',
  },
};

export const UrlError: Story = {
  args: {
    variant: 'error',
    children: '올바른 URL을 입력해주세요.',
  },
};
