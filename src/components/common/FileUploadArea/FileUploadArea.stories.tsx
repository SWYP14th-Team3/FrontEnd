import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileUploadArea } from './FileUploadArea';

const meta = {
  title: 'Common/FileUploadArea',
  component: FileUploadArea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '430px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUploadArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {},
};

export const WithFile: Story = {
  args: {
    file: new File([''], 'Document.pdf', { type: 'application/pdf' }),
  },
};

function InteractiveUpload() {
  const [file, setFile] = useState<File | null>(null);
  return <FileUploadArea file={file} onFileSelect={setFile} onFileRemove={() => setFile(null)} />;
}

export const Interactive: Story = {
  render: () => <InteractiveUpload />,
};
