import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricTrendWidget } from './MetricTrendWidget';
import { createCurrentItem } from '../stories/currentItem.fixture';

const meta = {
  title: 'Библиотека виджетов/Динамика',
  component: MetricTrendWidget,
  args: {
    item: createCurrentItem(),
    values: [24, 25.4, 23.8, 27.2, 28.6, 31.1, 30.4, 33.2, 34.7],
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MetricTrendWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Growing: Story = {};

export const Falling: Story = {
  args: {
    item: createCurrentItem({ value: 19.2, color: '#67E8F9' }),
    values: [34, 32.7, 33.1, 29.4, 27.8, 25.2, 22.6, 19.2],
  },
};

export const Stable: Story = {
  args: {
    item: createCurrentItem({ value: 34.7, color: '#6EE7B7' }),
    values: [34.7, 34.7, 34.7, 34.7, 34.7],
  },
};

export const NotEnoughData: Story = {
  args: { values: [34.7] },
};
