import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusPill } from './StatusPill';

const meta = {
  title: 'Библиотека виджетов/Статус',
  component: StatusPill,
  args: {
    state: 'ok',
    label: 'Данные поступают',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = {};
export const Warning: Story = { args: { state: 'warn', label: 'Поток нестабилен' } };
export const Error: Story = { args: { state: 'error', label: 'Нет данных' } };
export const Muted: Story = { args: { state: 'muted', label: 'Не настроено' } };
