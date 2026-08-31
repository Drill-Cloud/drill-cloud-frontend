import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MetricCard } from '../components/MetricCard';
import { MetricGaugeWidget } from '../components/MetricGaugeWidget';
import { MetricTrendWidget } from '../components/MetricTrendWidget';
import { MetricWidget } from '../components/MetricWidget';
import { createCurrentItem } from './currentItem.fixture';
import './widget-gallery.css';

/** Собирает варианты отображения одного тега на общей витрине. */
function TagWidgetGallery() {
  const item = createCurrentItem();

  return (
    <main className="widget-gallery">
      <header className="widget-gallery__hero">
        <span>Drill Cloud · библиотека интерфейса</span>
        <h1>Представление показания тега</h1>
        <p>
          Одно показание можно показать с разной плотностью информации. Цвет тега остаётся неизменным во всех
          представлениях.
        </p>
      </header>

      <section className="widget-gallery__section">
        <div className="widget-gallery__section-title">
          <span>01</span>
          <div>
            <h2>Компактный виджет</h2>
            <p>Для плотной сетки текущих значений.</p>
          </div>
        </div>
        <div className="widget-gallery__compact">
          <MetricWidget item={item} />
        </div>
      </section>

      <section className="widget-gallery__section">
        <div className="widget-gallery__section-title">
          <span>02</span>
          <div>
            <h2>Подробная карточка</h2>
            <p>Для контроля статуса и добавления показателя на график.</p>
          </div>
        </div>
        <MetricCard
          item={item}
          displayName={item.name ?? item.tag}
          selected
          statusInfo={{ status: 'normal', label: 'норма', ageSeconds: 4 }}
          onToggle={fn()}
        />
      </section>

      <section className="widget-gallery__section">
        <div className="widget-gallery__section-title">
          <span>03</span>
          <div>
            <h2>Круговая шкала</h2>
            <p>Для быстрого понимания положения внутри рабочего диапазона.</p>
          </div>
        </div>
        <MetricGaugeWidget item={item} />
      </section>

      <section className="widget-gallery__section">
        <div className="widget-gallery__section-title">
          <span>04</span>
          <div>
            <h2>Динамика</h2>
            <p>Для оценки направления изменения без открытия большого графика.</p>
          </div>
        </div>
        <MetricTrendWidget item={item} values={[24, 25.4, 23.8, 27.2, 28.6, 31.1, 30.4, 33.2, 34.7]} />
      </section>
    </main>
  );
}

const meta = {
  title: 'Библиотека виджетов/Витрина',
  component: TagWidgetGallery,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
} satisfies Meta<typeof TagWidgetGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {};
