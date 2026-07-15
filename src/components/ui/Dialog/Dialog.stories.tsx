import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from '@/components/ui/Button/Button';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SaveComplete: Story = {
  args: {
    open: true,
    onClose: () => {},
    icon: <span className="flex size-[46px] items-center justify-center text-[28px]">☑️</span>,
    title: '저장이 완료됐어요!',
    description: '저장된 결과에서 언제든 다시 확인하고 이어서 수정할 수 있어요.',
    actions: [
      { label: '저장 목록으로 이동', onClick: () => {}, variant: 'assistive' },
      { label: '페이지에 남기', onClick: () => {}, variant: 'primary' },
    ],
  },
};

export const DeleteConfirm: Story = {
  args: {
    open: true,
    onClose: () => {},
    icon: (
      <span className="bg-danger-5 flex size-[46px] items-center justify-center rounded-[22px] text-[28px]">❗</span>
    ),
    title: '분석 결과를 삭제하시겠어요?',
    description: '삭제한 결과는 복구할 수 없어요.',
    actions: [
      { label: '취소하기', onClick: () => {}, variant: 'assistive' },
      { label: '삭제하기', onClick: () => {}, variant: 'primary' },
    ],
  },
};

export const Logout: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: '로그아웃하시겠어요?',
    description: '로그아웃하면 저장된 분석 결과를 보려면 다시 로그인해야 해요.',
    actions: [
      { label: '취소하기', onClick: () => {}, variant: 'assistive' },
      { label: '로그아웃', onClick: () => {}, variant: 'primary' },
    ],
  },
};

export const RetryFailed: Story = {
  args: {
    open: true,
    onClose: () => {},
    title: '재분석에 실패했어요.',
    description: '잠시 후 다시 시도해 주세요.',
    actions: [{ label: '다시 시도하기', onClick: () => {}, variant: 'assistive' }],
  },
};

export const Interactive: Story = {
  render: function InteractiveDialog() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>다이얼로그 열기</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="저장이 완료됐어요!"
          description="저장된 결과에서 언제든 다시 확인하고 이어서 수정할 수 있어요."
          icon={<span className="flex size-[46px] items-center justify-center text-[28px]">☑️</span>}
          actions={[
            { label: '저장 목록으로 이동', onClick: () => setOpen(false), variant: 'assistive' },
            { label: '페이지에 남기', onClick: () => setOpen(false), variant: 'primary' },
          ]}
        />
      </>
    );
  },
};
