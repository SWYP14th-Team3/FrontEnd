import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Accordion } from './Accordion';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['confirmed', 'needsImprovement', 'missing'],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleProps = {
  title: 'Java/Spring 경험 3년 이상',
  description: '공고에서 Java/Spring Boot 경험을 필수로 요구하지만, 이력서 전체에서 관련 내용을 찾을 수 없습니다.',
  suggestion:
    "기술 스택에 Java, Spring Boot를 추가하고, 프로젝트 섹션에서 'Spring Boot 기반 REST API 개발, JPA를 활용한 데이터 모델링' 등을 구체적으로 기술하세요.",
};

export const Confirmed: Story = {
  args: { variant: 'confirmed', ...sampleProps, defaultOpen: true },
};

export const NeedsImprovement: Story = {
  args: { variant: 'needsImprovement', ...sampleProps, defaultOpen: true },
};

export const Missing: Story = {
  args: { variant: 'missing', ...sampleProps, defaultOpen: true },
};

export const Collapsed: Story = {
  args: { variant: 'confirmed', ...sampleProps, defaultOpen: false },
};

export const WithoutSuggestion: Story = {
  args: {
    variant: 'confirmed',
    title: 'Java/Spring 경험 3년 이상',
    description: '이력서에서 관련 경험이 확인되었습니다.',
    defaultOpen: true,
  },
};
