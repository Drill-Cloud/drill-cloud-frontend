import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MetricCard } from './MetricCard';
import { createCurrentItem } from '../stories/currentItem.fixture';

const meta = {
  title: 'Библиотека виджетов/Подробная карточка',
  component: MetricCard,
  args: {
    item: createCurrentItem(),
    displayName: 'Вес на крюке',
    selected: false,
    statusInfo: { status: 'normal', label: 'норма', ageSeconds: 4 },
    onToggle: fn(),
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Warning: Story = {
  args: {
    statusInfo: { status: 'warning', label: 'данные устаревают', ageSeconds: 48 },
  },
};

export const Critical: Story = {
  args: {
    item: createCurrentItem({ value: 54.2 }),
    statusInfo: { status: 'critical', label: 'выше уставки', ageSeconds: 3 },
  },
};

export const NoData: Story = {
  args: {
    item: createCurrentItem({ value: null }),
    statusInfo: { status: 'warning', label: 'нет данных', ageSeconds: 180 },
  },
};
