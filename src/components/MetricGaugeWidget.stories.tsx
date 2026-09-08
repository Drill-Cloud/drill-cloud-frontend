import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricGaugeWidget } from './MetricGaugeWidget';
import { createCurrentItem } from '../stories/currentItem.fixture';

const meta = {
  title: 'Библиотека виджетов/Круговая шкала',
  component: MetricGaugeWidget,
  args: {
    item: createCurrentItem(),
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MetricGaugeWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NearMaximum: Story = {
  args: { item: createCurrentItem({ value: 47.8, color: '#FB7185' }) },
};

export const NoRange: Story = {
  args: { item: createCurrentItem({ min: null, max: null }) },
};

export const NoData: Story = {
  args: { item: createCurrentItem({ value: null }) },
};
