import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ValidationMessage } from './ValidationMessage';

const meta = {
  title: 'UI/ValidationMessage',
  component: ValidationMessage,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ValidationMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FileSizeError: Story = {
  args: {
    children: '10MB 이하 파일만 업로드 가능합니다.',
  },
};

export const FileTypeError: Story = {
  args: {
    children: 'PDF 파일만 업로드 가능합니다.',
  },
};

export const UrlError: Story = {
  args: {
    children: '올바른 URL을 입력해주세요.',
  },
};
