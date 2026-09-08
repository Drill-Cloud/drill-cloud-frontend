import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricWidget } from './MetricWidget';
import { createCurrentItem } from '../stories/currentItem.fixture';

const meta = {
  title: 'Библиотека виджетов/Компактный показатель',
  component: MetricWidget,
  args: {
    item: createCurrentItem(),
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MetricWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Zero: Story = {
  args: { item: createCurrentItem({ value: 0 }) },
};

export const NoData: Story = {
  args: { item: createCurrentItem({ value: null }) },
};

export const LongName: Story = {
  args: {
    item: createCurrentItem({
      tag: 'edge5-v3-control-voltage-long-identifier',
      name: 'Контрольное напряжение шкафа управления верхнего привода',
      value: 10.238,
      unitOfMeasurement: 'В',
    }),
  },
};
